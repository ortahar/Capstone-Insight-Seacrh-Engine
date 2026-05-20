from groq import Groq
from src.llm.prompts import SYSTEM_PROMPT, RAG_PROMPT, INSIGHT_PROMPT
from config import GROQ_API_KEY, GROQ_MODEL

_client = None

def _get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=GROQ_API_KEY)
    return _client

def answer_question(question: str, context: str, history: list[dict] = None) -> str:
    client = _get_client()
    user_message = RAG_PROMPT.format(context=context, question=question)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    if history:
        for turn in history[-5:]:
            messages.append({"role": "user", "content": turn["question"]})
            messages.append({"role": "assistant", "content": turn["answer"]})
    messages.append({"role": "user", "content": user_message})
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=1024,
        messages=messages,
    )
    return response.choices[0].message.content

def generate_insights(text: str, company: str, period: str) -> str:
    client = _get_client()
    prompt = INSIGHT_PROMPT.format(company=company, period=period, text=text[:3000])
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=800,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content

def summarize_document(text: str, company: str, period: str) -> str:
    client = _get_client()
    prompt = f"""Summarize this {company} earnings call from {period} in 3-4 sentences.
Focus on: key financial results, strategic priorities, and competitive positioning.
TRANSCRIPT EXCERPT:
{text[:4000]}"""
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=400,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content

def summarize_news_article(text: str, company: str, title: str) -> str:
    client = _get_client()
    prompt = f"""You are a competitive intelligence analyst for Blue Shield of California.
Analyze this news article about {company} and extract the most important competitive insights
relevant to a health insurance company.
Article title: {title}
Article content:
{text[:3000]}
Provide:
1. One-sentence TL;DR
2. 3-4 bullet points of key competitive insights (strategy, financials, market position, product moves)
Keep each bullet concise and actionable."""
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=400,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
    )
    return response.choices[0].message.content
