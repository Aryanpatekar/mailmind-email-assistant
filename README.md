# AI Email Assistant with Multi-Agent System

![Google Stitch UI Prototype](https://lh3.googleusercontent.com/aida/ADBb0uizIZYJPnjImgAOQGMp6hRumc3auaO7YQwv8AWJF15rObLfX51gILxpZ4pZsqixzuslAw-uEAKzoGiI4yRuR9nEVUZyjnFh1saM77Huo02uEnwJRqCjVkXvGbbs_39UEMWju-nloGJ6boHhQfsByS9x8IlFNZkDYWDNPy5SqX1OzUadOfNbFH9304t9XOFp8ELm5OFKwKO49B-u-BDAvSM3exwL22kWj017DGhExEhqJA3HhXnvQm04Li4)

---

## Overview
The AI Email Assistant is an intelligent web application powered by a sophisticated multi-agent backend architecture. It takes minimal, informal user input and automatically transforms it into highly professional, polished emails. The system handles the entire lifecycle of an email—from understanding the context and adjusting the tone, to reviewing the grammar, acquiring user approval, and automatically sending the email via SMTP. It also features built-in fallback mechanisms, retry protocols, and history tracking.

---

## Problem Statement
Writing professional emails can be time-consuming, repetitive, and mentally draining. People often struggle to find the right tone or wording, leading to stress when communicating with supervisors, clients, or professors. Additionally, drafting emails from scratch for routine requests (like sick leaves, follow-ups, or meeting schedules) reduces productivity. 

---

## Solution
This system solves the problem by acting as an intelligent intermediary between rough thoughts and a sent email. By utilizing a Multi-Agent AI System and advanced automation, users can input a fragmented thought like *"sick today, fever, need 2 days off"* and select a recipient type. The highly specialized AI agents collaborate in milliseconds to draft, review, and adjust the email into a flawless, ready-to-send professional document.

---

## Features
- **AI Email Generation:** Uses advanced LLMs (Google Gemini) to transform short inputs into long-form professional emails.
- **Multi-Agent Architecture:** A decentralized ecosystem of narrow-focus AI agents that handle specific tasks in the pipeline.
- **Tone Adjustment:** Dynamically restructures vocabulary depending on whether the recipient is a manager, friend, or unfamiliar corporate contact.
- **Auto Email Sending:** Integrated SMTP protocols to deliver emails directly to the recipient's inbox.
- **Retry Mechanism:** Built-in fault tolerance attempts to send failed emails up to 3 times with exponential backoff.
- **Memory Storage:** Secure local caching of past emails, allowing for filtering and one-click reuse or deletion.
- **Template Fallback:** A deterministic safety net that provides high-quality static templates if the AI generation API goes offline.

---

## System Architecture
The application runs on a Node.js/Express backend that acts as the orchestrator. When a user request hits the API, the orchestrator passes the data sequentially through a "pipeline" of distinct software agents. Each agent receives the data, modifies or analyzes it based on its specialized purpose, and passes it to the next agent in the chain. 

---

## Agents Description

1. **Input Understanding Agent**  
   Analyzes the raw user input to identify the core intent, the urgency of the message, and the hierarchical relationship with the target recipient.
2. **Email Generation Agent**  
   The core AI writer. It takes the parsed context from the Input Agent and queries a Large Language Model (e.g., Gemini) to generate the initial draft of the subject line and body.
3. **Review & Optimization Agent**  
   Acts as an automated proofreader. It scans the generated draft for grammar errors, structural flow, and clarity, making necessary corrections.
4. **Tone Adjustment Agent**  
   Refines the approved draft by modifying the vocabulary. It ensures the email is properly formal for a boss, polite for a colleague, or casual for a friend.
5. **Sending Agent**  
   A specialized network agent that interfaces with NodeMailer and Gmail SMTP. It requires an explicit "confirmed" boolean flag from the user before initiating the automated delivery protocol.
6. **Retry Agent**  
   Monitors the Sending Agent. If network failure or API throttling occurs, the Retry Agent takes over, queuing the email and re-attempting delivery up to 3 times.
7. **Memory Agent**  
   A localized database manager that logs context, drafted content, and delivery timestamps into a JSON storage file, serving as the user's outbox and draft history.
8. **Template Agent**  
   A strict, rule-based fallback mechanism. If the Generation Agent detects an API failure, the Template Agent intercepts the flow and provides a highly professional, pre-written standard template based on the identified intent.

---

## Workflow (Step-by-Step)

1. **User gives input:** The user types a brief requirement and an email address into the web dashboard.
2. **Input processed:** The *Input Understanding Agent* breaks down the raw text into structured JSON data.
3. **Email generated:** The *Email Generation Agent* writes the initial draft based on the structured data.
4. **Email reviewed:** The draft is scrubbed for errors by the *Review & Optimization Agent*.
5. **Tone adjusted:** The *Tone Adjustment Agent* applies the final stylistic polish.
6. **User approval:** The finished draft is returned to the frontend UI for the user to read, edit, and approve.
7. **Email sent:** Upon user confirmation, the *Sending Agent* attempts to dispatch the email via SMTP.
8. **Retry if failed:** If the SMTP connection drops, the *Retry Agent* attempts to resend it multiple times.
9. **Store in memory:** Regardless of success or failure, the *Memory Agent* saves the draft and its status to the local history database.
10. **Fallback if needed:** If the AI fails at Step 3, the *Template Agent* skips Steps 4 and 5 to instantly provide the user with a reliable draft.

---

## Tech Stack
- **Frontend:** Vanilla HTML5, CSS3 (Glassmorphism UI), JavaScript
- **Backend:** Node.js, Express.js
- **AI API:** Google Gemini API (`@google/generative-ai`)
- **Database:** Local JSON File Storage (`fs/promises`)
- **Email API:** Nodemailer (Gmail SMTP Server)

---

## Data Flow
The Frontend UI makes a `POST` request to the Backend APIs `/api/email/generate`. The request payload is routed through `intentAgent` -> `toneAgent` -> `emailGeneratorAgent` -> `reviewAgent`. The resulting JSON payload containing the `subject` and `body` is returned to the Frontend UI. When the user clicks "Send", a `POST` request is sent to `/api/email/send`, passing through the `senderAgent` (which utilizes the `retryAgent`), and finally logged by the `memoryAgent`.

---

## Error Handling
The backend is wrapped in global `try/catch` blocks. 
- **AI Failures:** If the Gemini API returns a 500 error, rate limit, or timeout, the `emailGeneratorAgent` automatically catches the error and executes the `templateAgent` logic. 
- **SMTP Failures:** The `senderAgent` catches authentication or connection errors and triggers a recursive loop in the `retryAgent` with a 2000ms backoff timer. The frontend receives standard HTTP error codes (`400`, `500`) converted into user-friendly UI Toast notifications.

---

## Security Considerations
- **Email Validation:** Regular Expressions (Regex) ensure recipient email domains are syntactically valid before any processing begins.
- **User Confirmation:** The API strictly enforces a payload requirement where `confirmed: true` must be passed; otherwise, the Sending Agent rejects the payload.
- **Data Safety:** App passwords and API keys are strictly maintained in a `.env` file and never exposed to the frontend browser or pushed to version control.

---

## Future Enhancements
- **Voice Input:** Allowing users to dictate their raw thoughts via a microphone.
- **Multi-language Support:** Automatically detecting user input language and generating the email in Spanish, French, German, etc.
- **Smart Suggestions:** Auto-suggesting recipient emails based on previous memory history.
- **Mobile App:** Porting the browser-based dashboard to a standalone iOS/Android application using React Native.

---

## Conclusion
The AI Email Assistant is a robust demonstration of how distinct, narrow AI agents can collaborate to solve daily workflow friction. By masking highly reliable infrastructure—such as SMTP integrations, retry handlers, and fallback templates—behind a sleek, modern interface, the system empowers users to handle professional communications with unprecedented speed, confidence, and accuracy. This multi-agent paradigm serves as a blueprint for the future of task automation.
