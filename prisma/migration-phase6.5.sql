-- Phase 6.5: Advanced Google Integrations - Database Migration
-- Add new models for Drive, Docs, Forms, and AI Analytics

-- Google Drive Files Table
CREATE TABLE IF NOT EXISTS google_drive_files (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    googleAccountId TEXT NOT NULL,
    googleFileId TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    mimeType TEXT NOT NULL,
    size INTEGER,
    parentFolderId TEXT,
    path TEXT,
    starred BOOLEAN DEFAULT FALSE,
    trashed BOOLEAN DEFAULT FALSE,
    description TEXT,
    iconLink TEXT,
    thumbnailLink TEXT,
    webViewLink TEXT,
    webContentLink TEXT,
    downloadUrl TEXT,
    owners TEXT,
    permissions TEXT,
    shared BOOLEAN DEFAULT FALSE,
    agentId TEXT,
    aiProcessed BOOLEAN DEFAULT FALSE,
    aiCategory TEXT,
    aiTags TEXT,
    aiSummary TEXT,
    googleCreatedTime DATETIME,
    googleModifiedTime DATETIME,
    lastSync DATETIME DEFAULT CURRENT_TIMESTAMP,
    syncStatus TEXT DEFAULT 'synced',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (googleAccountId) REFERENCES google_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (agentId) REFERENCES agents(id) ON DELETE SET NULL
);

-- Google Docs Table
CREATE TABLE IF NOT EXISTS google_docs (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    googleAccountId TEXT NOT NULL,
    googleDocId TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    content TEXT,
    wordCount INTEGER,
    language TEXT,
    agentId TEXT,
    aiGenerated BOOLEAN DEFAULT FALSE,
    purpose TEXT,
    aiSummary TEXT,
    aiKeywords TEXT,
    aiCategory TEXT,
    aiSentiment TEXT,
    isTemplate BOOLEAN DEFAULT FALSE,
    templateType TEXT,
    sourceEmail TEXT,
    sourceCalendar TEXT,
    autoUpdated BOOLEAN DEFAULT FALSE,
    googleCreatedTime DATETIME,
    googleModifiedTime DATETIME,
    lastSync DATETIME DEFAULT CURRENT_TIMESTAMP,
    syncStatus TEXT DEFAULT 'synced',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (googleAccountId) REFERENCES google_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (agentId) REFERENCES agents(id) ON DELETE SET NULL
);

-- Google Forms Table
CREATE TABLE IF NOT EXISTS google_forms (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    googleAccountId TEXT NOT NULL,
    googleFormId TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    settings TEXT,
    questions TEXT,
    isActive BOOLEAN DEFAULT TRUE,
    acceptingResponses BOOLEAN DEFAULT TRUE,
    responseLimit INTEGER,
    agentId TEXT,
    aiGenerated BOOLEAN DEFAULT FALSE,
    purpose TEXT,
    totalResponses INTEGER DEFAULT 0,
    lastResponseAt DATETIME,
    autoNotify BOOLEAN DEFAULT FALSE,
    notifyEmail TEXT,
    autoSheet TEXT,
    aiInsights TEXT,
    responsePatterns TEXT,
    googleCreatedTime DATETIME,
    googleModifiedTime DATETIME,
    lastSync DATETIME DEFAULT CURRENT_TIMESTAMP,
    syncStatus TEXT DEFAULT 'synced',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (googleAccountId) REFERENCES google_accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (agentId) REFERENCES agents(id) ON DELETE SET NULL
);

-- Google Form Responses Table
CREATE TABLE IF NOT EXISTS google_form_responses (
    id TEXT PRIMARY KEY,
    formId TEXT NOT NULL,
    googleResponseId TEXT UNIQUE NOT NULL,
    respondentEmail TEXT,
    responses TEXT NOT NULL,
    submittedAt DATETIME NOT NULL,
    isComplete BOOLEAN DEFAULT TRUE,
    aiProcessed BOOLEAN DEFAULT FALSE,
    aiSentiment TEXT,
    aiCategory TEXT,
    aiInsights TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (formId) REFERENCES google_forms(id) ON DELETE CASCADE
);

-- AI Analytics Jobs Table  
CREATE TABLE IF NOT EXISTS ai_analytics_jobs (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    dataSources TEXT NOT NULL,
    parameters TEXT,
    status TEXT DEFAULT 'pending',
    progress REAL DEFAULT 0,
    results TEXT,
    insights TEXT,
    isScheduled BOOLEAN DEFAULT FALSE,
    schedule TEXT,
    nextRun DATETIME,
    lastRun DATETIME,
    startedAt DATETIME,
    completedAt DATETIME,
    duration INTEGER,
    errorMessage TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- AI Insights Table
CREATE TABLE IF NOT EXISTS ai_insights (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    data TEXT NOT NULL,
    confidence REAL NOT NULL,
    priority TEXT DEFAULT 'medium',
    dataSources TEXT NOT NULL,
    timeRange TEXT,
    isActive BOOLEAN DEFAULT TRUE,
    isRead BOOLEAN DEFAULT FALSE,
    isDismissed BOOLEAN DEFAULT FALSE,
    actionTaken TEXT,
    actionResults TEXT,
    validUntil DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_google_drive_files_user ON google_drive_files(userId);
CREATE INDEX IF NOT EXISTS idx_google_drive_files_account ON google_drive_files(googleAccountId);
CREATE INDEX IF NOT EXISTS idx_google_drive_files_file ON google_drive_files(googleFileId);
CREATE INDEX IF NOT EXISTS idx_google_drive_files_parent ON google_drive_files(parentFolderId);

CREATE INDEX IF NOT EXISTS idx_google_docs_user ON google_docs(userId);
CREATE INDEX IF NOT EXISTS idx_google_docs_account ON google_docs(googleAccountId);
CREATE INDEX IF NOT EXISTS idx_google_docs_doc ON google_docs(googleDocId);

CREATE INDEX IF NOT EXISTS idx_google_forms_user ON google_forms(userId);
CREATE INDEX IF NOT EXISTS idx_google_forms_account ON google_forms(googleAccountId);
CREATE INDEX IF NOT EXISTS idx_google_forms_form ON google_forms(googleFormId);

CREATE INDEX IF NOT EXISTS idx_google_form_responses_form ON google_form_responses(formId);
CREATE INDEX IF NOT EXISTS idx_google_form_responses_response ON google_form_responses(googleResponseId);

CREATE INDEX IF NOT EXISTS idx_ai_analytics_jobs_user ON ai_analytics_jobs(userId);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_jobs_status ON ai_analytics_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_analytics_jobs_type ON ai_analytics_jobs(type);

CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_insights(userId);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_priority ON ai_insights(priority);
CREATE INDEX IF NOT EXISTS idx_ai_insights_active ON ai_insights(isActive); 