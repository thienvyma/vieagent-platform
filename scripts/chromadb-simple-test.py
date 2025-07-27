#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ChromaDB Simple Test for Day 4 - No Unicode
"""

import sys
import os

def test_chromadb():
    """Test ChromaDB embedded mode"""
    try:
        import chromadb
        print("PASS: ChromaDB import successful")
        
        # Test embedded client
        client = chromadb.PersistentClient(path="./chromadb_data")
        print("PASS: ChromaDB client created")
        
        # Test collection
        collection = client.get_or_create_collection("day4_foundation_test")
        print("PASS: Collection ready")
        
        # Test data operations
        test_docs = [
            "AI agents can automate business processes",
            "Machine learning helps with data analysis",
            "Natural language processing enables text understanding"
        ]
        
        test_ids = ["doc_1", "doc_2", "doc_3"]
        
        collection.add(
            documents=test_docs,
            ids=test_ids
        )
        print("PASS: Documents added successfully")
        
        # Test query
        results = collection.query(
            query_texts=["artificial intelligence"],
            n_results=2
        )
        
        num_results = len(results['documents'][0])
        print(f"PASS: Query returned {num_results} results")
        
        # Test count
        count = collection.count()
        print(f"PASS: Collection contains {count} documents")
        
        print("SUCCESS: ChromaDB data flow working perfectly!")
        return True
        
    except ImportError as e:
        print(f"FAIL: ChromaDB not installed - {e}")
        return False
        
    except Exception as e:
        print(f"FAIL: ChromaDB error - {e}")
        return False

if __name__ == "__main__":
    success = test_chromadb()
    sys.exit(0 if success else 1) 