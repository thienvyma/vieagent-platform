import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { writeFile, readFile } from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// GET /api/user/documents - Lấy danh sách documents
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const documents = await prisma.document.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        filename: true,
        type: true,
        size: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        viewCount: true,
        lastViewed: true,
        processedAt: true,
        errorMessage: true,
        content: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

// POST /api/user/documents - Upload document mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 5MB for Vercel compatibility)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size too large. Maximum 5MB allowed for optimal processing.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'text/csv',
      'application/json',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'File type not supported. Only TXT, PDF, CSV, JSON, DOCX files are allowed.',
        },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads');

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const uniqueFilename = `${timestamp}-${baseName}${extension}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Determine document type
    let docType = 'text';
    if (file.type.includes('pdf')) docType = 'pdf';
    else if (file.type.includes('csv')) docType = 'csv';
    else if (file.type.includes('json')) docType = 'json';
    else if (file.type.includes('word') || file.type.includes('document')) docType = 'docx';

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        title: title || originalName,
        filename: uniqueFilename,
        type: docType,
        size: file.size,
        mimeType: file.type,
        userId,
        status: 'UPLOADED',
        filePath: filePath,
      },
    });

    // Start processing (async)
    processDocument(document.id).catch(console.error);

    return NextResponse.json({
      success: true,
      data: {
        id: document.id,
        title: document.title,
        type: document.type,
        size: document.size,
        status: document.status,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}

// Async function to process document (placeholder)
async function processDocument(documentId: string) {
  try {
    // Update status to processing
    await prisma.document.update({
      where: { id: documentId },
      data: { status: 'PROCESSING' },
    });

    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document || !document.filePath) {
      throw new Error('Document not found');
    }

    // Read file content
    const fileContent = await readFile(document.filePath, 'utf-8');
    let parsedContent: any = null;
    const validationErrors: string[] = [];

    // Parse and validate based on file type and format
    if (document.type === 'csv') {
      parsedContent = await parseAndValidateCSV(fileContent, document.title);
    } else if (document.type === 'json') {
      parsedContent = await parseAndValidateJSON(fileContent, document.title);
    } else if (document.type === 'text' || document.type === 'txt') {
      parsedContent = await parseAndValidateText(fileContent, document.title);
    }

    // Update document with parsed content
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: parsedContent ? 'PROCESSED' : 'ERROR',
        processedAt: new Date(),
        content: parsedContent ? JSON.stringify(parsedContent) : null,
        errorMessage: parsedContent ? null : validationErrors.join('; '),
      },
    });
  } catch (error) {
    console.error('Error processing document:', error);
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: 'ERROR',
        errorMessage: error instanceof Error ? error.message : 'Processing failed',
      },
    });
  }
}

// Parse and validate CSV format
async function parseAndValidateCSV(content: string, title: string): Promise<any> {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have header and at least one data row');
  }

  // Auto-detect delimiter
  const firstLine = lines[0];
  let delimiter = ',';
  const delimiters = ['|', ',', ';', '\t'];

  for (const del of delimiters) {
    if (firstLine.includes(del)) {
      delimiter = del;
      break;
    }
  }

  console.log(`📊 Detected CSV delimiter: "${delimiter}"`);

  // Helper function to parse CSV line with quoted values and custom delimiter
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current.trim());

    return result;
  };

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
  const data: any[] = [];

  // Detect format based on headers
  const isProductData = headers.some(h => h.includes('product name') || h.includes('tên sản phẩm'));
  const isFAQData = headers.some(h => h.includes('question') || h.includes('câu hỏi'));

  if (isProductData) {
    // Validate Product Data format: Product Name | Price | Description | Image URL | Product Link | Notes
    const requiredHeaders = ['product name', 'price', 'description'];
    const missing = requiredHeaders.filter(h => !headers.some(header => header.includes(h)));

    if (missing.length > 0) {
      throw new Error(`Missing required headers for Product Data: ${missing.join(', ')}`);
    }

    // Parse product data
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length >= 3) {
        const productNameIndex = headers.findIndex(h => h.includes('product name')) || 0;
        const priceIndex = headers.findIndex(h => h.includes('price')) || 1;
        const descIndex = headers.findIndex(h => h.includes('description')) || 2;
        const imageIndex = headers.findIndex(h => h.includes('image')) || 3;
        const linkIndex = headers.findIndex(h => h.includes('link')) || 4;
        const notesIndex = headers.findIndex(h => h.includes('notes')) || 5;

        data.push({
          type: 'product',
          productName: values[productNameIndex] || '',
          price: values[priceIndex] || '',
          description: values[descIndex] || '',
          imageUrl: values[imageIndex] || '',
          productLink: values[linkIndex] || '',
          notes: values[notesIndex] || '',
        });
      }
    }

    return {
      format: 'product_catalog',
      totalItems: data.length,
      data,
    };
  } else if (isFAQData) {
    // Validate FAQ Data format: Question | Answer
    const questionIndex = headers.findIndex(h => h.includes('question') || h.includes('câu hỏi'));
    const answerIndex = headers.findIndex(h => h.includes('answer') || h.includes('trả lời'));

    if (questionIndex === -1 || answerIndex === -1) {
      throw new Error(`Invalid FAQ format. Headers found: ${headers.join(', ')}`);
    }

    // Parse FAQ data
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        // Skip empty lines
        const values = parseCSVLine(lines[i]);
        if (values.length >= 2) {
          data.push({
            type: 'faq',
            question: values[questionIndex] || '',
            answer: values[answerIndex] || '',
          });
        }
      }
    }

    return {
      format: 'faq',
      totalItems: data.length,
      data,
    };
  } else {
    // Check if user tried to upload FAQ or Product format but headers don't match
    if (headers.length === 2) {
      // Might be FAQ format with wrong headers
      throw new Error(
        `Unsupported CSV structure. For FAQ format, use headers: "Question | Answer" or "Câu hỏi | Trả lời". Found: ${headers.join(' | ')}`
      );
    } else if (headers.length >= 3) {
      // Might be Product format with wrong headers
      throw new Error(
        `Unsupported CSV structure. For Product format, use headers: "Name | Price | Description | Image | Link | Note". Found: ${headers.join(' | ')}`
      );
    }

    // Generic CSV parsing for other cases
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        // Skip empty lines
        const values = parseCSVLine(lines[i]);
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return {
      format: 'generic_csv',
      headers,
      totalItems: data.length,
      data,
    };
  }
}

// Parse and validate JSON format
async function parseAndValidateJSON(content: string, title: string): Promise<any> {
  try {
    const jsonData = JSON.parse(content);

    // Detect format
    if (Array.isArray(jsonData)) {
      // Check if it's product or FAQ data
      if (jsonData.length > 0) {
        const firstItem = jsonData[0];

        if (firstItem.productName || firstItem.product_name) {
          // Product catalog format
          return {
            format: 'product_catalog',
            totalItems: jsonData.length,
            data: jsonData.map(item => ({
              type: 'product',
              productName: item.productName || item.product_name,
              price: item.price,
              description: item.description,
              imageUrl: item.imageUrl || item.image_url || '',
              productLink: item.productLink || item.product_link || '',
              notes: item.notes || '',
            })),
          };
        } else if (firstItem.question && firstItem.answer) {
          // FAQ format
          return {
            format: 'faq',
            totalItems: jsonData.length,
            data: jsonData.map(item => ({
              type: 'faq',
              question: item.question,
              answer: item.answer,
            })),
          };
        }
      }
    } else if (jsonData.businessName || jsonData.business_name) {
      // Business info format
      return {
        format: 'business_info',
        data: {
          type: 'business',
          businessName: jsonData.businessName || jsonData.business_name,
          description: jsonData.description || '',
          address: jsonData.address || '',
          phone: jsonData.phone || '',
          email: jsonData.email || '',
          website: jsonData.website || '',
          services: jsonData.services || [],
        },
      };
    }

    // Generic JSON
    return {
      format: 'generic_json',
      data: jsonData,
    };
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

// Parse and validate text format
async function parseAndValidateText(content: string, title: string): Promise<any> {
  const lines = content.trim().split('\n');

  // Check if it's structured FAQ format (Q: ... A: ...)
  const qaPattern = /^(Q:|Question:|Câu hỏi:)/i;
  const answerPattern = /^(A:|Answer:|Trả lời:)/i;

  const faqs: any[] = [];
  let currentQ: string | null = null;

  for (const line of lines) {
    if (qaPattern.test(line)) {
      currentQ = line.replace(qaPattern, '').trim();
    } else if (answerPattern.test(line) && currentQ) {
      faqs.push({
        type: 'faq',
        question: currentQ,
        answer: line.replace(answerPattern, '').trim(),
      });
      currentQ = null;
    }
  }

  if (faqs.length > 0) {
    return {
      format: 'faq',
      totalItems: faqs.length,
      data: faqs,
    };
  }

  // Otherwise treat as general knowledge text
  return {
    format: 'text_knowledge',
    data: {
      type: 'text',
      content: content,
      lineCount: lines.length,
      wordCount: content.split(/\s+/).length,
    },
  };
}
