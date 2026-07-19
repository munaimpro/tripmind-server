import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
dotenv.config();
import { jwtVerify, createRemoteJWKSet } from 'jose-cjs';
import { generateTripPlan, optimizeBudget } from './services/aiService';

const mongodburi = process.env.MONGO_URI!;

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

const client = new MongoClient(mongodburi, {
    serverApi: { 
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const db = client.db('tripmind');
        
        const usersCollection = db.collection('users');
        const destinationsCollection = db.collection('destinations');
        const tripsCollection = db.collection('trips');
        const hotelsCollection = db.collection('hotels');
        const restaurantsCollection = db.collection('restaurants');
        const activitiesCollection = db.collection('activities');
        const savedTripsCollection = db.collection('savedTrips');
        const aiPlansCollection = db.collection('aiPlans');
        const reviewsCollection = db.collection('reviews');
        const notificationsCollection = db.collection('notifications');

        const JWKS = createRemoteJWKSet(
            new URL(`${process.env.CLIENT_URL!}/api/auth/jwks`)
        );

        const verifyToken = async (request: Request, response: Response, next: NextFunction) => {
            const authHeader = request.headers.authorization;
            if (!authHeader) {
                return response.status(401).json({ success: false, message: "Unauthorized" });
            }
            
            const token = authHeader.split(" ")[1];
            if (!token) {
                return response.status(401).json({ success: false, message: "Unauthorized" });
            }

            try {
                const { payload } = await jwtVerify(token, JWKS);
                (request as any).user = payload;
                return next()
            } catch (error) {
                return response.status(403).json({ success: false, message: "Forbidden" })
            }
        }

        // ==========================================
        // PUBLIC APIs
        // ==========================================

        // For home page
        app.get('/destinations', async (req: Request, res: Response) => {
            try {
                const result = await destinationsCollection.find().toArray();
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        
        app.get('/destinations/:id', async (req: Request, res: Response) => {
            try {
                const { id } = req.params;
                const result = await destinationsCollection.findOne({ _id: new ObjectId(id) });
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        // For Explore Trips page
        app.get('/trips', async (req: Request, res: Response) => {
            try {
                const result = await tripsCollection.find().toArray();
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.get('/trips/:id', async (req: Request, res: Response) => {
            try {
                const { id } = req.params;
                const result = await tripsCollection.findOne({ _id: new ObjectId(id) });
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.get('/hotels', async (req: Request, res: Response) => {
            try {
                const result = await hotelsCollection.find().toArray();
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.get('/restaurants', async (req: Request, res: Response) => {
            try {
                const result = await restaurantsCollection.find().toArray();
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.get('/activities', async (req: Request, res: Response) => {
            try {
                const result = await activitiesCollection.find().toArray();
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        // ==========================================
        // PROTECTED APIs
        // ==========================================

        // For Profile page
        app.get('/me', verifyToken, async (req: Request, res: Response) => {
            try {
                const userPayload = (req as any).user;
                const email = userPayload?.email;
                
                let user = null;
                if (email) {
                    user = await usersCollection.findOne({ email });
                }
                
                res.json({ success: true, data: user || userPayload });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        // For User Dashbaord Page - UserDashboard
        app.get('/my-trips', verifyToken, async (req: Request, res: Response) => {
            try {
                const userEmail = (req as any).user?.email;
                if (!userEmail) {
                    return res.status(400).json({ success: false, message: 'User email not found in token' });
                }
                const result = await tripsCollection.find({ userEmail }).toArray();
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        // For User Dashbaord Page - SavedTrips
        app.get('/saved-trips', verifyToken, async (req: Request, res: Response) => {
            try {
                const userEmail = (req as any).user?.email;
                if (!userEmail) {
                    return res.status(400).json({ success: false, message: 'User email not found in token' });
                }
                const result = await savedTripsCollection.find({ userEmail }).toArray();
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        // For User Dashbaord Page - SavedTrips
        app.post('/saved-trips', verifyToken, async (req: Request, res: Response) => {
            try {
                const userEmail = (req as any).user?.email;
                if (!userEmail) {
                    return res.status(400).json({ success: false, message: 'User email not found in token' });
                }
                
                const savedTripData = req.body;
                const result = await savedTripsCollection.insertOne({
                    ...savedTripData,
                    userEmail,
                    savedAt: new Date()
                });
                
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        // For User Dashbaord Page - SavedTrips
        app.delete('/saved-trips/:id', verifyToken, async (req: Request, res: Response) => {
            try {
                const { id } = req.params;
                const userEmail = (req as any).user?.email;
                
                if (!userEmail) {
                    return res.status(400).json({ success: false, message: 'User email not found in token' });
                }
                
                const result = await savedTripsCollection.deleteOne({ 
                    _id: new ObjectId(id),
                    userEmail 
                });
                
                if (result.deletedCount === 0) {
                    return res.status(404).json({ success: false, message: 'Saved trip not found or unauthorized' });
                }
                
                res.json({ success: true, message: "Saved trip deleted successfully" });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.post('/reviews', verifyToken, async (req: Request, res: Response) => {
            try {
                const userEmail = (req as any).user?.email;
                const userName = (req as any).user?.name || (req as any).user?.given_name || 'Anonymous';
                
                if (!userEmail) {
                    return res.status(400).json({ success: false, message: 'User email not found in token' });
                }
                
                const reviewData = req.body;
                
                const result = await reviewsCollection.insertOne({
                    ...reviewData,
                    userEmail,
                    userName,
                    createdAt: new Date()
                });
                
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        // ==========================================
        // AI APIs
        // ==========================================

        app.post('/ai/generate-trip', async (req: Request, res: Response) => {
            try {
                console.log("Gemini Key:", process.env.GEMINI_API_KEY);
                const tripDetails = req.body;
                
                // Validate input simply
                if (!tripDetails.destination || !tripDetails.budget || !tripDetails.duration) {
                    return res.status(400).json({ success: false, message: 'Missing required trip details (destination, budget, duration)' });
                }

                // Generate trip using Gemini
                const generatedPlan = await generateTripPlan(tripDetails);

                // Save to MongoDB
                const planToSave = {
                    ...generatedPlan,
                    originalRequest: tripDetails,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const result = await aiPlansCollection.insertOne(planToSave);

                res.json({ success: true, data: { _id: result.insertedId, ...planToSave } });
            } catch (error: any) {
                console.error("Generate trip error:", error);
                res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
            }
        });

        app.post('/ai/optimize-budget', async (req: Request, res: Response) => {
            try {
                const { aiPlanId, newBudget } = req.body;

                if (!aiPlanId || !newBudget) {
                    return res.status(400).json({ success: false, message: 'Missing aiPlanId or newBudget' });
                }

                // Fetch existing plan
                const existingPlan = await aiPlansCollection.findOne({ _id: new ObjectId(aiPlanId) });
                if (!existingPlan) {
                    return res.status(404).json({ success: false, message: 'AI Plan not found' });
                }

                // Remove mongo specific IDs before sending to AI to avoid confusion
                const { _id, createdAt, updatedAt, ...planDataForAi } = existingPlan;

                // Optimize using Gemini
                const optimizedPlan = await optimizeBudget(planDataForAi, newBudget);

                // Update existing plan in MongoDB
                const updateData = {
                    ...optimizedPlan,
                    updatedAt: new Date()
                };

                await aiPlansCollection.updateOne(
                    { _id: new ObjectId(aiPlanId) },
                    { $set: updateData }
                );

                res.json({ success: true, data: { _id: aiPlanId, ...updateData } });
            } catch (error: any) {
                console.error("Optimize budget error:", error);
                res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
            }
        });

        // ==========================================
        // ADMIN APIs
        // ==========================================

        app.post('/add-destination', async (req: Request, res: Response) => {
            try {
                const destinationData = req.body;
                const result = await destinationsCollection.insertOne({
                    ...destinationData,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.put('/destination/:id', async (req: Request, res: Response) => {
            try {
                const { id } = req.params;

                const updateData = req.body;

                delete updateData._id;

                const result = await destinationsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    {
                        $set: {
                            ...updateData,
                            updatedAt: new Date(),
                        },
                    }
                );

                res.json({
                    success: true,
                    data: result,
                });
            } catch (error) {
                console.log(error);
                res.status(500).json({
                    success: false,
                    message: "Internal Server Error",
                });
            }
        });

        app.delete('/delete-destination/:id', async (req: Request, res: Response) => {
            try {
                const { id } = req.params;
                const result = await destinationsCollection.deleteOne({ _id: new ObjectId(id) });
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.get('/admin/dashboard', verifyToken, async (req: Request, res: Response) => {
            try {
                const totalUsers = await usersCollection.estimatedDocumentCount();
                const totalDestinations = await destinationsCollection.estimatedDocumentCount();
                const totalTrips = await tripsCollection.estimatedDocumentCount();
                const totalAiPlans = await aiPlansCollection.estimatedDocumentCount();

                const popularDestinations = await destinationsCollection.find().limit(5).toArray();
                const recentReviews = await reviewsCollection.find().sort({ createdAt: -1 }).limit(5).toArray();

                res.json({
                    success: true,
                    data: {
                        totalUsers,
                        totalDestinations,
                        totalTrips,
                        totalAiPlans,
                        popularDestinations,
                        recentReviews
                    }
                });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req: Request, res: Response) => {
    res.send('TripMind Typescript Server is Running Successfully!');
});

app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
});