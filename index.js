const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const stripe = require('stripe')(process.env.SECRET_KEY)
// console.log(process.env.SECRET_KEY)

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
        const paymentCollection = client.db('learnBridgeCollection').collection('paymentCollection');
        const assignmentCollection = client.db('learnBridgeCollection').collection('assignmentCollection');
        const assignmentSubmissionCollection = client.db('learnBridgeCollection').collection('assignmentSubmissionCollection');
        // jwt related api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '1h' });
            res.send({ token })
        })
        // middlewares
        const verifyToken = (req, res, next) => {
            // console.log('inside token', req.headers.authorization)
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
        app.get('/addteachersclass', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await addTeachersClassCollection.find(query).toArray()
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
                    name: updatedItem.name,
                    email: updatedItem.email
                }
            }
            const result = await addTeachersClassCollection.updateOne(filter, Item, options)
            res.send(result)
        })

        app.delete('/addteachersclass/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await addTeachersClassCollection.deleteOne(filter)
            res.send(result)
        })

        // Assignment Collection related api
        app.post('/assignmentcollection', async (req, res) => {
            const assignmentcollection = req.body;
            const result = await assignmentCollection.insertOne(assignmentcollection);
            res.send(result);
        })
        app.get('/assignmentcollection', async (req, res) => {
            const result = await assignmentCollection.find({}).toArray()
            res.send(result)
        })
        app.get('/assignmentcollection/:title', async (req, res) => {
            const title = req.params.title
            // console.log(title)
            const query = { title: title }
            const result = await assignmentCollection.find(query).toArray()
            res.send(result)
        })

         // Assignment Submit Collection related api
         app.post('/assignmentsubmitcollection', async (req, res) => {
            const assignmentsubmitcollection = req.body;
            const result = await assignmentSubmissionCollection.insertOne(assignmentsubmitcollection);
            res.send(result);
        })
        app.get('/assignmentsubmitcollection',async(req,res)=>{
            const result = await assignmentSubmissionCollection.find({}).toArray()
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
        app.post('/allclass', async (req, res) => {
            const allclass = req.body;
            const result = await allClassesCollection.insertOne(allclass);
            res.send(result);
        })

        app.get('/allclass', async (req, res) => {
            const result = await allClassesCollection.find({}).toArray()
            // console.log(result)
            res.send(result)
        })
        app.get('/allclass/:id', async (req, res) => {
            const result = await allClassesCollection.find({}).toArray()
            res.send(result)
        })

        app.get('/allclass', async (req, res) => {
            const query = { total_enrolment: { $gt: 0 } }
            const options = {
                sort: { total_enrolment: -1 },
            };
            const result = await allClassesCollection.find(query, options).toArray()
            res.send(result)
        })


        // app.post('/enroll/:id', async (req, res) => {
        //     const classId = req.params.id
        //     const result = await allClassesCollection.findOneAndUpdate(
        //         { _id: new ObjectId(classId) },
        //         { $inc: { enrollment: 1 } },
        //         { returnDocument: 'after' }
        //     )
        //     if (result && result.value && result.value.enrollment !== undefined) {
        //         res.status(200).json({ enrollment: result.value.enrollment });
        //     } else {
        //         res.status(404).send('Class not found');
        //     }
        // })

        // app.get('/enroll/:id', async (req, res) => {
        //     const classId = req.params.id
        //     const result = await allClassesCollection.findOne({ _id: new Object(classId) })
        //     if (result) {
        //         res.status(200).json({ enrollment: result.enrollment });
        //     } else {
        //         res.status(404).send('Class not found');
        //     }
        // })

        // app.get('/enroll', async (req, res) => {
        //     try {
        //         const enrollments = await allClassesCollection.find().toArray();
        //         const totalEnrollments = {};
        //         enrollments.forEach((enrollment) => {
        //             totalEnrollments[enrollment.classId] = enrollment.count;
        //         });
        //         res.json(totalEnrollments);
        //     } catch (error) {
        //         console.error(error);
        //         res.status(500).send('Internal Server Error');
        //     }
        // });

        // payment intent related api
        app.post('/create-payment-intent', async (req, res) => {
            const { amount } = req.body;
            const price = parseInt(amount * 100)
            // console.log(price, 'inside intent')
            const paymentIntent = await stripe.paymentIntents.create({
                amount: price,
                currency: 'usd',
                payment_method_types: ['card'],
                // date: new Date(paymentIntent.)

            })
            // console.log(paymentIntent)
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })

        // payment collection
        app.post('/payment', async (req, res) => {
            const payment = req.body;
            // console.log(payment)
            const result = await paymentCollection.insertOne(payment);
            res.send(result);
        })
        app.get('/payment', async (req, res) => {
            const result = await paymentCollection.find({}).toArray()
            res.send(result)
        })

        app.get('/payment/:email', async (req, res) => {
            const email = req.params.email
            const query = { email: email }
            // console.log(email)
            const result = await paymentCollection.find(query).toArray()
            // console.log(result)
            res.send(result)
        })

        app.get('/payment/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await paymentCollection.findOne(filter).toArray();
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