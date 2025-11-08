# ai_integration.py
import json
from google import genai
import os
from typing import List, Dict, Any
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer

class AIIntegration:
    def __init__(self):
        # Initialize Gemini
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
        
        # Initialize embedding model for semantic search
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def get_llm_response(self, messages: List[Dict]) -> str:
        """Get response from Gemini API"""
        try:
            # Convert messages to Gemini format
            gemini_messages = []
            for msg in messages:
                if msg["role"] == "system":
                    # For system messages, we'll prepend to the first user message
                    continue
                gemini_messages.append({
                    "role": "user" if msg["role"] == "user" else "model",
                    "parts": [msg["content"]]
                })
            
            # Start chat or generate content
            if len(gemini_messages) > 1:
                chat = self.model.start_chat(history=gemini_messages[:-1])
                response = chat.send_message(gemini_messages[-1]["parts"][0])
            else:
                response = self.model.generate_content(gemini_messages[0]["parts"][0])
            
            return response.text
        except Exception as e:
            print(f"Gemini API error: {e}")
            return "I apologize, but I'm having trouble responding right now."
    
    def generate_embeddings(self, text: str) -> List[float]:
        """Generate embeddings for semantic search"""
        return self.embedding_model.encode(text).tolist()
    
    def generate_conversation_summary(self, messages: List[Dict]) -> Dict[str, Any]:
        """Generate comprehensive conversation analysis using Gemini"""
        conversation_text = "\n".join([f"{msg['sender']}: {msg['content']}" for msg in messages])
        
        prompt = f"""Analyze the following conversation and provide a comprehensive analysis in JSON format with these exact keys:
        - "summary": A concise 2-3 sentence summary of the main discussion points
        - "key_topics": A list of 3-5 main topics discussed (as strings)
        - "action_items": A list of any action items, decisions, or next steps mentioned (as strings)
        - "sentiment": The overall sentiment of the conversation (positive, negative, or neutral)

        Conversation:
        {conversation_text}

        Provide only valid JSON without any additional text:"""
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean the response to extract JSON
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            analysis = json.loads(response_text)
            
            # Validate required keys
            required_keys = ["summary", "key_topics", "action_items", "sentiment"]
            for key in required_keys:
                if key not in analysis:
                    analysis[key] = [] if key.endswith('s') else ""
            
            return analysis
            
        except Exception as e:
            print(f"Error generating conversation summary: {e}")
            return {
                "summary": "Unable to generate summary at this time.",
                "key_topics": [],
                "action_items": [],
                "sentiment": "neutral"
            }
    
    def query_past_conversations(self, query: str, conversations: List[Dict]) -> Dict[str, Any]:
        """Intelligent querying across past conversations using Gemini"""
        # Generate query embedding
        query_embedding = self.generate_embeddings(query)
        
        # Calculate similarity with all messages
        relevant_messages = []
        for conv in conversations:
            for msg in conv['messages']:
                if msg.get('embeddings'):
                    similarity = cosine_similarity(
                        [query_embedding], 
                        [msg['embeddings']]
                    )[0][0]
                    if similarity > 0.3:  # Threshold for relevance
                        relevant_messages.append({
                            'conversation': conv['title'],
                            'content': msg['content'],
                            'sender': msg['sender'],
                            'similarity': similarity,
                            'timestamp': msg['timestamp']
                        })
        
        # Sort by relevance
        relevant_messages.sort(key=lambda x: x['similarity'], reverse=True)
        
        # Prepare context for Gemini
        context = "\n".join([
            f"From conversation '{msg['conversation']}': {msg['content']}" 
            for msg in relevant_messages[:5]  # Top 5 most relevant
        ])
        
        prompt = f"""Based on the following context from past conversations, answer the user's question accurately and helpfully. 
        If the context doesn't contain relevant information to answer the question, clearly state that you couldn't find specific information.

        Context from past conversations:
        {context}

        User's question: {query}

        Please provide a direct answer to the question based on the available context:"""
        
        try:
            response = self.model.generate_content(prompt)
            answer = response.text
        except Exception as e:
            print(f"Error querying conversations: {e}")
            answer = "I apologize, but I encountered an error while searching through your past conversations."
        
        return {
            "answer": answer,
            "relevant_conversations": list(set([msg['conversation'] for msg in relevant_messages[:3]])),
            "supporting_excerpts": relevant_messages[:3]
        }