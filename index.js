const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const cors = require('cors')
const port = process.env.PORT || 3000
require('dotenv').config()

// middleware 
app.use(cors());
app.use(express.json())

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@smasam.hmi3csj.mongodb.net/?retryWrites=true&w=majority&appName=smasam`;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@smasam.hmi3csj.mongodb.net/?retryWrites=true&w=majority&tls=true`;


// console.log(process.env.DB_USER)
// console.log(process.env.DB_PASS)

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
        const usersCollection = client.db('smasam_backend').collection('users')
        const afghanCollection = client.db('smasam_backend').collection('afghan')
        const persianCollection = client.db('smasam_backend').collection('persian')
        const indianCollection = client.db('smasam_backend').collection('indian')
        const lambCollection = client.db('smasam_backend').collection('lamb')
        const takeAwayCollection = client.db('smasam_backend').collection('takeAway')
        const lunchCollection = client.db('smasam_backend').collection('lunch')



        // app.post('/marathons', async (req, res) => {
        //     const data = req.body;
        //     console.log(data)
        //     const result = await marathonCollection.insertOne(data)
        //     res.send(result)
        // })

        // Afghan Menu, Persian Menu, Indian Menu, Roasted Lamb, Takeaway Menu, Lunch Menu, Contact Form



        // post api  for 6 menu///

        // post api for aghan 
        app.post("/afghan", async (req, res) => {
            const data = req.body;
            console.log(data)
            // count total orders to generate unique order number
            const count = await afghanCollection.countDocuments();
            // add extra fields before inserting
            const newOrder = {
                ...data,
                orderNumber: `smasam/afghan-${(count + 1).toString().padStart(3, "0")}`,
                orderStatus: "Pending",
                lastUpdate: "Not Delivered",
                createdAt: new Date(),
            };
            const result = await afghanCollection.insertOne(newOrder);
            res.send(result);
        });

        // get afghan data
        app.get('/afghan', async (req, res) => {
            const result = await afghanCollection.find().toArray();
            res.send(result);
        });

        //change value in afghan data 
        app.put("/afghan/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;
                const result = await afghanCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    res.send({ success: true, message: "Order updated successfully" });
                } else {
                    res.status(404).send({ success: false, message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating order:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });
        // afghan  end ------------------------------------------

        // post api for persian 
        app.post('/persian', async (req, res) => {
            const data = req.body;
            const result = await persianCollection.insertOne(data)
            res.send(result)
        })

        //persian  end-----------------------




        // post api for indian menu 
        app.post("/indian", async (req, res) => {
            const data = req.body;
            console.log(data)
            // count total orders to generate unique order number
            const count = await indianCollection.countDocuments();
            // add extra fields before inserting
            const newOrder = {
                ...data,
                orderNumber: `smasam/indian-${(count + 1).toString().padStart(3, "0")}`,
                orderStatus: "Pending",
                lastUpdate: "Not Delivered",
                createdAt: new Date(),
            };
            const result = await indianCollection.insertOne(newOrder);
            res.send(result);
        });


        // get indian data
        app.get('/indian', async (req, res) => {
            const result = await indianCollection.find().toArray();
            res.send(result);
        });

        // put request for indian menu 
        app.put("/indian/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;
                const result = await indianCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    res.send({ success: true, message: "Order updated successfully" });
                } else {
                    res.status(404).send({ success: false, message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating order:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });

        ///indian end ---------------------------

        //post api for lamb
        app.post("/lamb", async (req, res) => {
            const data = req.body;
            console.log(data)
            // count total orders to generate unique order number
            const count = await lambCollection.countDocuments();
            // add extra fields before inserting
            const newOrder = {
                ...data,
                orderNumber: `smasam/lamb-${(count + 1).toString().padStart(3, "0")}`,
                orderStatus: "Pending",
                lastUpdate: "Not Delivered",
                createdAt: new Date(),
            };
            const result = await lambCollection.insertOne(newOrder);
            res.send(result);
        });

        // get lamb data
        app.get('/lamb', async (req, res) => {
            const result = await lambCollection.find().toArray();
            res.send(result);
        });


        app.put("/lamb/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;
                const result = await lambCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    res.send({ success: true, message: "Order updated successfully" });
                } else {
                    res.status(404).send({ success: false, message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating order:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });



        // lamb end ---------------------------

        // takeaway start ----------------------------------
        //post api for takeAway
        app.post("/takeAway", async (req, res) => {
            const data = req.body;
            console.log(data)
            // count total orders to generate unique order number
            const count = await takeAwayCollection.countDocuments();
            // add extra fields before inserting
            const newOrder = {
                ...data,
                orderNumber: `smasam/take-${(count + 1).toString().padStart(3, "0")}`,
                orderStatus: "Pending",
                lastUpdate: "Not Delivered",
            };
            const result = await takeAwayCollection.insertOne(newOrder);
            res.send(result);
        });


        // get takeaway data
        app.get('/takeAway', async (req, res) => {
            const result = await takeAwayCollection.find().toArray();
            res.send(result);
        });


        app.put("/takeaway/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;
                const result = await takeAwayCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    res.send({ success: true, message: "Order updated successfully" });
                } else {
                    res.status(404).send({ success: false, message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating order:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });


        // takeaway end ---------------------------


        //post api for lunch
        app.post('/lunch', async (req, res) => {
            const data = req.body;
            const result = await lunchCollection.insertOne(data);
            res.send(result)
        })


        //get data  endpoit 



        // get persian data
        app.get('/persian', async (req, res) => {
            const result = await persianCollection.find().toArray();
            res.send(result);
        });






        // get lunch data
        app.get('/lunch', async (req, res) => {
            const result = await lunchCollection.find().toArray();
            res.send(result);
        });





        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().limit(6).toArray()
            console.log(result)
            res.send(result)
        })


        //testing

        // // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Application is working')
})




app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})


