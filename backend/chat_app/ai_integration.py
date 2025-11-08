# backend/chat_app/ai_integration.py
import os
import numpy as np
from typing import List, Dict, Any, Generator
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
from google import genai
from google.genai import types
import logging
logger = logging.getLogger(__name__)

class GeminiAIIntegration:
    def __init__(self):
        # Initialize Google Gen AI client
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        try:
            self.client = genai.Client(api_key=api_key)
            logger.info("Google Gen AI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Google Gen AI client: {e}")
            raise
        
        # Initialize embedding model for semantic search
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    def get_llm_response(self, messages: List[Dict]) -> str:
        """Get response from Gemini API using the new SDK"""
        try:
            # Convert messages to the format expected by the new SDK
            contents = []
            system_instruction = None
            
            for msg in messages:
                if msg["role"] == "system":
                    system_instruction = msg["content"]
                elif msg["role"] == "user":
                    contents.append(types.Part.from_text(text=msg["content"]))
                elif msg["role"] == "assistant":
                    contents.append(types.Part.from_text(text=msg["content"]))
            
            # Prepare config with system instruction if available
            config = None
            if system_instruction:
                config = types.GenerateContentConfig(
                    system_instruction=system_instruction
                )
            
            # Generate content using the new SDK
            response = self.client.models.generate_content(
                model='gemini-2.0-flash',  # Using a stable model
                contents=contents,
                config=config
            )
            
            return response.text if response.text else "I apologize, but I couldn't generate a response."
            
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return "I apologize, but I'm having trouble responding right now."
    
    def get_llm_response_stream(self, messages: List[Dict]) -> Generator[str, None, None]:
        """Stream response from Gemini API"""
        try:
            # Convert messages to the format expected by the new SDK
            contents = []
            system_instruction = None
            
            for msg in messages:
                if msg["role"] == "system":
                    system_instruction = msg["content"]
                elif msg["role"] == "user":
                    contents.append(types.Part.from_text(text=msg["content"]))
                elif msg["role"] == "assistant":
                    contents.append(types.Part.from_text(text=msg["content"]))
            
            # Prepare config with system instruction if available
            config = None
            if system_instruction:
                config = types.GenerateContentConfig(
                    system_instruction=system_instruction
                )
            
            # Stream content using the new SDK
            for chunk in self.client.models.generate_content_stream(
                model='gemini-2.0-flash',
                contents=contents,
                config=config
            ):
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            logger.error(f"Gemini API streaming error: {e}")
            yield "I apologize, but I'm having trouble responding right now."
    
    def generate_embeddings(self, text: str) -> List[float]:
        """Generate vector embeddings using SentenceTransformer"""
        if not text or not text.strip():
            return []
        try:
            return self.embedding_model.encode(text).tolist()
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            return []

   # backend/chat_app/ai_integration.py
    def query_past_conversations(self, query: str, conversations: List[Dict]) -> Dict[str, Any]:
        """Intelligent querying across past conversations using Gemini"""
        try:
            logger.info(f"Starting AI query for: '{query}' across {len(conversations)} conversations")
            
            # Generate query embedding for semantic search
            query_embedding = self.generate_embeddings(query)
            logger.info(f"Generated query embedding: {len(query_embedding)} dimensions")
            
            # Calculate similarity with all messages across conversations
            relevant_messages = []
            total_messages_processed = 0
            
            for conv in conversations:
                for msg in conv['messages']:
                    total_messages_processed += 1
                    
                    # If embeddings exist, use them for semantic search
                    if msg.get('embeddings') and isinstance(msg['embeddings'], list):
                        try:
                            similarity = cosine_similarity(
                                [query_embedding], 
                                [msg['embeddings']]
                            )[0][0]
                            if similarity > 0.2:  # Lower threshold to catch more matches
                                relevant_messages.append({
                                    'conversation': conv['title'],
                                    'content': msg['content'],
                                    'sender': msg['sender'],
                                    'similarity': float(similarity),
                                    'timestamp': msg['timestamp']
                                })
                        except Exception as e:
                            logger.warning(f"Error calculating similarity: {e}")
                            continue
                    else:
                        # Fallback: simple text matching if no embeddings
                        if query.lower() in msg['content'].lower():
                            relevant_messages.append({
                                'conversation': conv['title'],
                                'content': msg['content'],
                                'sender': msg['sender'],
                                'similarity': 0.5,  # Default score for text match
                                'timestamp': msg['timestamp']
                            })
            
            logger.info(f"Processed {total_messages_processed} messages, found {len(relevant_messages)} relevant messages")
            
            # Sort by relevance (highest similarity first)
            relevant_messages.sort(key=lambda x: x['similarity'], reverse=True)
            
            # Prepare context for Gemini
            context_messages = relevant_messages[:8]  # Increase context window
            context = "\n".join([
                f"From conversation '{msg['conversation']}' ({msg['sender']}): {msg['content']}" 
                for msg in context_messages
            ])
            
            logger.info(f"Context length: {len(context)} characters")
            
            if not context.strip():
                # If no specific matches found, try to use conversation summaries
                summaries_context = "\n".join([
                    f"Conversation '{conv['title']}': {conv['summary'] or 'No summary available'}"
                    for conv in conversations[:5]  # Use top 5 conversations
                ])
                
                if summaries_context.strip():
                    prompt = f"""Based on the following conversation summaries, answer the user's question as best as you can.

                    Conversation summaries:
                    {summaries_context}

                    User's question: {query}

                    Please provide a helpful answer based on the available information:"""
                else:
                    return {
                        "answer": "I couldn't find any relevant information in your past conversations that matches your query. You might want to start some conversations first.",
                        "relevant_conversations": [],
                        "supporting_excerpts": []
                    }
            else:
                prompt = f"""Based on the following context from past conversations, answer the user's question accurately and helpfully. 
                If the context doesn't contain relevant information to answer the question, try to provide general helpful information.

                Context from past conversations:
                {context}

                User's question: {query}

                Please provide a direct answer to the question based on the available context:"""
            
            # Use the new SDK for query response
            response = self.client.models.generate_content(
                model='gemini-2.0-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=1000
                )
            )
            
            answer = response.text if response.text else "I couldn't generate a response based on the available information."
            
            # Get unique relevant conversation titles
            relevant_conversation_titles = list(set([
                msg['conversation'] for msg in relevant_messages[:5]  # Increase to 5
            ]))
            
            result = {
                "answer": answer,
                "relevant_conversations": relevant_conversation_titles,
                "supporting_excerpts": relevant_messages[:5]  # Increase to 5 excerpts
            }
            
            logger.info(f"Final result: {len(relevant_conversation_titles)} relevant conversations, {len(relevant_messages[:5])} excerpts")
            return result
            
        except Exception as e:
            logger.error(f"Error querying conversations: {e}")
            return {
                "answer": "I apologize, but I encountered an error while searching through your past conversations. Please try again.",
                "relevant_conversations": [],
                "supporting_excerpts": []
            }
    # ✅ Add this
    def close(self):
        """Optional cleanup method (kept for compatibility with views)"""
        pass
    # ... rest of the existing methods (generate_embeddings, generate_conversation_summary, etc.)