import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Helper function to get Gemini Client safely
 */
const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY is missing in environment variables.");
    }
    return new GoogleGenerativeAI(apiKey);
};

interface TripDetails {
    destination: string;
    budget: number;
    duration: number;
    travelStyle: string;
    groupType: string;
    interests: string[];
}

/**
 * Generates a structured trip plan using Gemini API
 */
export const generateTripPlan = async (tripDetails: TripDetails) => {
    try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const prompt = `
        You are an expert travel planner. Create a detailed travel itinerary based on the following preferences:
        Destination: ${tripDetails.destination}
        Budget: $${tripDetails.budget}
        Duration: ${tripDetails.duration} days
        Travel Style: ${tripDetails.travelStyle}
        Group Type: ${tripDetails.groupType}
        Interests: ${tripDetails.interests?.join(', ') || 'General sightseeing'}

        Please provide a highly structured JSON response with the following format:
        {
            "title": "A catchy title for the trip",
            "destination": "The destination name",
            "duration": ${tripDetails.duration},
            "totalEstimatedCost": <estimated cost number>,
            "currency": "USD",
            "summary": "A brief summary of the trip",
            "itinerary": [
                {
                    "day": 1,
                    "activities": [
                        {
                            "time": "Morning/Afternoon/Evening",
                            "description": "What to do",
                            "estimatedCost": <number>
                        }
                    ]
                }
            ],
            "accommodations": [
                {
                    "name": "Hotel name",
                    "type": "Hotel/Hostel/Airbnb",
                    "estimatedCostPerNight": <number>
                }
            ]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return JSON.parse(text);
    } catch (error: any) {
        console.error("Error generating trip plan with Gemini:", error);
        throw new Error(error.message || "Failed to generate trip plan.");
    }
};

/**
 * Optimizes an existing trip plan based on a new budget
 */
export const optimizeBudget = async (existingPlan: any, newBudget: number) => {
    try {
        const genAI = getGeminiClient();
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const prompt = `
        You are an expert travel planner. I have an existing travel plan, but I need to optimize it to fit a new budget of $${newBudget}.
        
        Current Plan (JSON):
        ${JSON.stringify(existingPlan)}

        Please analyze the current plan and suggest modifications to bring the "totalEstimatedCost" down (or up) to match the new budget of $${newBudget} as closely as possible. You can change accommodations or activities.
        
        Return the exact same JSON structure as the original plan, but with the updated values. Make sure it is valid JSON.
        `;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        return JSON.parse(text);
    } catch (error: any) {
        console.error("Error optimizing budget with Gemini:", error);
        throw new Error(error.message || "Failed to optimize budget.");
    }
};