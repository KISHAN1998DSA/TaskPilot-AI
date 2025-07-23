const { validationResult } = require('express-validator');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

/**
 * @desc    Generate subtasks from task description
 * @route   POST /api/ai/generate-subtasks
 * @access  Private
 */
exports.generateSubtasks = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { taskDescription } = req.body;

    if (!taskDescription) {
      return res.status(400).json({ message: 'Task description is required' });
    }

    // Generate subtasks using Google AI
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Based on the following task description, generate a list of 3-5 subtasks that would help complete this task. Return ONLY a JSON array of objects with 'title' and 'completed' properties. Example: [{"title": "First subtask", "completed": false}, {"title": "Second subtask", "completed": false}]. Task description: ${taskDescription}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON array from response
    const jsonMatch = text.match(/\[.*\]/s);
    if (!jsonMatch) {
      return res.status(500).json({ message: 'Failed to generate valid subtasks' });
    }

    try {
      const subtasks = JSON.parse(jsonMatch[0]);
      res.json(subtasks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to parse generated subtasks' });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Analyze task priority based on description and due date
 * @route   POST /api/ai/analyze-priority
 * @access  Private
 */
exports.analyzePriority = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { taskDescription, dueDate } = req.body;

    if (!taskDescription) {
      return res.status(400).json({ message: 'Task description is required' });
    }

    // Analyze priority using Google AI
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Based on the following task description and due date, determine the appropriate priority level (Low, Medium, or High). Return ONLY the priority level as a single word. Task description: ${taskDescription}. Due date: ${dueDate || 'Not specified'}.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();

    // Normalize the response
    let priority;
    if (text.toLowerCase().includes('high')) {
      priority = 'High';
    } else if (text.toLowerCase().includes('medium')) {
      priority = 'Medium';
    } else {
      priority = 'Low';
    }

    res.json({ priority });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Parse natural language input to create task
 * @route   POST /api/ai/parse-task
 * @access  Private
 */
exports.parseTaskFromText = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text input is required' });
    }

    // Parse task from text using Google AI
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Parse the following natural language input and extract task details. Return ONLY a JSON object with these properties: title, description, dueDate (YYYY-MM-DD format if present, null if not), priority (Low, Medium, High). Input: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Extract JSON object from response
    const jsonMatch = responseText.match(/\{.*\}/s);
    if (!jsonMatch) {
      return res.status(500).json({ message: 'Failed to parse task from text' });
    }

    try {
      const taskData = JSON.parse(jsonMatch[0]);
      res.json(taskData);
    } catch (error) {
      res.status(500).json({ message: 'Failed to parse generated task data' });
    }
  } catch (error) {
    next(error);
  }
}; 