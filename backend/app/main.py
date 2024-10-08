import streamlit as st
from openai import OpenAI
import tiktoken
import sqlite3
import numpy as np
import pandas as pd
import pdfplumber
from io import BytesIO
from dotenv import load_dotenv
import os

load_dotenv()

# Set OpenAI API key
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

# Initialize the SQLite database
DB_NAME = "embeddings.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT,
        content TEXT,
        embedding BLOB
    )
    ''')
    conn.commit()
    conn.close()

init_db()

# Helper function to save embedding to SQLite
def save_embedding(filename: str, content: str, embedding: list):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO embeddings (filename, content, embedding) VALUES (?, ?, ?)
    ''', (filename, content, sqlite3.Binary(np.array(embedding, dtype=np.float32).tobytes())))
    conn.commit()
    conn.close()

def num_tokens_from_string(string):
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.get_encoding("cl100k_base")
    num_tokens = len(encoding.encode(string))
    return num_tokens

def chunk_text(text, max_tokens=200):
    words = text.split()
    chunks = []
    current_chunk = []

    for word in words:
        temp_chunk = current_chunk + [word]
        temp_text = " ".join(temp_chunk)
        new_token_count = num_tokens_from_string(temp_text)
        
        if new_token_count > max_tokens:
            chunks.append(" ".join(current_chunk))
            current_chunk = [word]
        else:
            current_chunk.append(word)

    if current_chunk:
        chunks.append(" ".join(current_chunk))
    
    return chunks

# Helper function to extract text from PDF
def extract_pdf_data(file: BytesIO):
    all_text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            all_text += page.extract_text() + "\n"  # Concatenate the text of each page
    return all_text

# Helper function to calculate cosine similarity
def cosine_similarity(vec1, vec2):
    dot_product = np.dot(vec1, vec2)
    norm_vec1 = np.linalg.norm(vec1)
    norm_vec2 = np.linalg.norm(vec2)
    return dot_product / (norm_vec1 * norm_vec2)

# Helper function to search for the most similar embedding
def search_most_similar_embedding(user_embedding):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('SELECT DISTINCT content, embedding FROM embeddings')
    results = cursor.fetchall()
    conn.close()

    # Convert user embedding and stored embeddings into numpy arrays
    user_embedding = np.array(user_embedding)

    similarities = []

    for content, embedding_blob in results:
        embedding = np.frombuffer(embedding_blob, dtype=np.float32)
        similarity = cosine_similarity(user_embedding, embedding)
        similarities.append((content, similarity))
    
    
    # Sort by similarity in descending order and select top 3
    similarities.sort(key=lambda x: x[1], reverse=True)
    top_similar_contents = [content for content, sim in similarities[:2]]

    return top_similar_contents

# Streamlit app
st.title("AI Model Interaction Platform")

# File upload
uploaded_file = st.file_uploader("Upload a file", type=["pdf", "csv", "xlsx"])

if uploaded_file:
    if uploaded_file.name.endswith('.csv'):
        df = pd.read_csv(uploaded_file)
        content = df.to_string()
    elif uploaded_file.name.endswith('.xlsx'):
        df = pd.read_excel(uploaded_file)
        content = df.to_string()
    elif uploaded_file.name.endswith('.pdf'):
        content = extract_pdf_data(uploaded_file)
    else:
        st.error("Unsupported file type.")
        content = None

    if content:
        chunks = chunk_text(content, max_tokens=500)
        for chunk in chunks:
            # Generate embedding using OpenAI API
            response = client.embeddings.create(
                input=chunk,
                model="text-embedding-ada-002"
            )
            embedding = response.data[0].embedding

            # Save the embedding and content to SQLite
            save_embedding(uploaded_file.name, chunk, embedding)

        st.success("File uploaded and embeddings saved successfully.")

# Chat interface
user_message = st.text_input("Enter your message")

if st.button("Send"):
    if user_message:
        # Generate embedding for the user's message
        response = client.embeddings.create(
            input=user_message,
            model="text-embedding-ada-002"
        )
        user_embedding = response.data[0].embedding

        # Search for the most similar embedding in the database
        most_similar_content = search_most_similar_embedding(user_embedding)

        response_placeholder = st.empty()

        if most_similar_content:
            # Stream response from OpenAI API
            stream = client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": f"Based on the following content:\n{most_similar_content}\n\nUser: {user_message}\n\nAI:"}],
                stream=True
            )

            # Stream the response content
            print(stream)
            response_text = ""
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    response_text += chunk.choices[0].delta.content
                    response_placeholder.write(response_text, unsafe_allow_html=True)
                    
        else:
            st.error("No similar content found in embeddings.")
