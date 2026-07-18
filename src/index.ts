import express, { NextFunction, Request, Response } from 'express';
import * as dotenv from 'dotenv';
import cors from 'cors';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
dotenv.config();
import { jwtVerify, createRemoteJWKSet } from 'jose-cjs';

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

        app.get('/me', verifyToken, async (req: Request, res: Response) => {
            try {
                res.json({ success: true, message: "User profile data placeholder" });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.get('/my-trips', verifyToken, async (req: Request, res: Response) => {
            try {
                res.json({ success: true, message: "User's trips placeholder" });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.get('/saved-trips', verifyToken, async (req: Request, res: Response) => {
            try {
                res.json({ success: true, message: "Saved trips placeholder" });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.post('/saved-trips', verifyToken, async (req: Request, res: Response) => {
            try {
                res.json({ success: true, message: "Trip saved successfully placeholder" });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.delete('/saved-trips/:id', verifyToken, async (req: Request, res: Response) => {
            try {
                res.json({ success: true, message: "Saved trip deleted successfully placeholder" });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.post('/reviews', verifyToken, async (req: Request, res: Response) => {
            try {
                res.json({ success: true, message: "Review posted successfully placeholder" });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        // ==========================================
        // AI APIs
        // ==========================================

        app.post('/ai/generate-trip', async (req: Request, res: Response) => {
            try {
                res.json({ success: true, message: "AI generated trip plan placeholder" });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.post('/ai/optimize-budget', async (req: Request, res: Response) => {
            try {
                res.json({ success: true, message: "AI budget optimization result placeholder" });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        // ==========================================
        // ADMIN APIs
        // ==========================================

        app.post('/destinations', verifyToken, async (req: Request, res: Response) => {
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

        app.put('/destinations/:id', verifyToken, async (req: Request, res: Response) => {
            try {
                const { id } = req.params;
                const updateData = req.body;
                const result = await destinationsCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { 
                        $set: {
                            ...updateData,
                            updatedAt: new Date()
                        } 
                    }
                );
                res.json({ success: true, data: result });
            } catch (error) {
                res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        });

        app.delete('/destinations/:id', verifyToken, async (req: Request, res: Response) => {
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