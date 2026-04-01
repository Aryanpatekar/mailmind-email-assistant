/**
 * API Wrapper for MailMind Backend
 * Communicates with the 7-Agent intelligent backend system.
 */

const API_BASE = '/api/email';

const ApiService = {
  /**
   * Generates an email draft via the Intent -> Tone -> Generator pipeline.
   * @param {Object} payload { userInput, tone, receiverEmail }
   * @returns {Promise<Object>} The generated email object { subject, body, rawOutput, usedFallback }
   */
  async generateEmail(payload) {
    try {
      const response = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate email');
      }
      
      return data;
    } catch (error) {
      console.error('API Generate Error:', error);
      throw error;
    }
  },

  /**
   * Sends an approved email via the Sender Agent (with Confirmation Gate).
   * @param {Object} payload { to, subject, body, userInput, tone, receiver, purpose, confirmed }
   * @returns {Promise<Object>} { success, status, message }
   */
  async sendEmail(payload) {
    try {
      const response = await fetch(`${API_BASE}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      // 202 Accepted means Pending (e.g., missing confirmation)
      // 502 Bad Gateway means the Retry Agent completely failed
      if (!response.ok && response.status !== 202) {
        throw new Error(data.message || 'Failed to send email');
      }
      
      return data;
    } catch (error) {
      console.error('API Send Error:', error);
      throw error;
    }
  },

  /**
   * Retrieves email history from the Memory Store Agent.
   * @returns {Promise<Array>} Array of saved email objects
   */
  async getHistory() {
    try {
      const response = await fetch(`${API_BASE}/history`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch history');
      }
      
      return data.emails || [];
    } catch (error) {
      console.error('API History Error:', error);
      throw error;
    }
  },

  /**
   * Deletes an email from history.
   * @param {string} id 
   * @returns {Promise<boolean>}
   */
  async deleteHistory(id) {
    try {
      const response = await fetch(`${API_BASE}/history/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('API Delete Error:', error);
      throw error;
    }
  }
};
