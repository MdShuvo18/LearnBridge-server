const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;


// middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ameizfp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });

        const userCollection = client.db('learnBridgeCollection').collection('user');
        const allClassesCollection = client.db('learnBridgeCollection').collection('allclasses');
        const applyteachesCollection = client.db('learnBridgeCollection').collection('applyteaches');
        const addTeachersClassCollection = client.db('learnBridgeCollection').collection('addteachersclass');

        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ token })
        })
        // middlewares
        const verifyToken = (req, res, next) => {
            console.log('inside token', req.headers.authorization)
            if (!req.headers.authorization) {
                return res.status(401).send({ message: "Forbidden access" })
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: "Forbidden access" })
                }
                req.decoded = decoded;
                next()
            });

        }

        // make admin related api
        app.patch('/user/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        app.get('/user/admin/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: "Unathuorized access" })
            }
            const query = { email: email }
            const user = await userCollection.findOne(query)
            let admin = false;
            if (user) {
                admin = user.role === 'admin'
            }
            res.send({ admin })
        })

        // make teacher realted api
        app.patch('/applyteaches/teacher/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    role: 'teacher'
                }
            }
            const result = await applyteachesCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        app.get('/applyteaches/teacher/:email', verifyToken, async (req, res) => {
            const email = req.params.email;
            if (email !== req.decoded.email) {
                return res.status(403).send({ message: "Unathuorized access" })
            }
            const query = { email: email }
            const user = await applyteachesCollection.findOne(query)
            let teacher = false;
            if (user) {
                teacher = user.role === 'teacher'
            }
            res.send({ teacher })
        })




        // apply teaches related api
        app.post('/applyteaches', async (req, res) => {
            const applyteaches = req.body;
            const result = await applyteachesCollection.insertOne(applyteaches);
            res.send(result);
        })

        app.get('/applyteaches', async (req, res) => {
            const result = await applyteachesCollection.find({}).toArray()
            res.send(result)
        })

        app.patch('/applyteaches/teacher/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    role: 'teacher'
                }
            }
            const result = await applyteachesCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })

        app.delete('/applyteaches/teacher/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await applyteachesCollection.deleteOne(filter)
            res.send(result)
        })

        // teacher add class related api
        app.post('/addteachersclass', async (req, res) => {
            const addteachersclass = req.body;
            const result = await addTeachersClassCollection.insertOne(addteachersclass);
            res.send(result);
        })
        app.get('/addteachersclass', async (req, res) => {
            const result = await addTeachersClassCollection.find({}).toArray()
            res.send(result)
        })

        app.get('/addteachersclass/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await addTeachersClassCollection.findOne(filter)
            res.send(result)
        })

        app.put('/addteachersclass/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedItem = req.body;
            const Item = {
                $set: {
                    title: updatedItem.title,
                    description: updatedItem.description,
                    price: updatedItem.price,
                    image: updatedItem.image,
                    name:updatedItem.name,
                    email: updatedItem.email
                }
            }
            const result = await addTeachersClassCollection.updateOne(filter, Item, options)
            res.send(result)
        })




        //  user related api
        app.post('/user', async (req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
        })

        app.get('/user', verifyToken, async (req, res) => {
            const result = await userCollection.find({}).toArray()
            res.send(result)
        })

        // allclasses related api
        app.get('/allclasses', async (req, res) => {
            const query = { total_enrolment: { $gt: 100 } }
            const options = {
                sort: { total_enrolment: 1 },
            };
            const result = await allClassesCollection.find(query, options).toArray()
            res.send(result)
        })


        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Hello shuvo!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})