const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const nodemailer = require('nodemailer');
const app = express()
const cors = require('cors')
const port = process.env.PORT || 3000
require('dotenv').config()

// middleware 
app.use(cors());
app.use(express.json())

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@smasam.hmi3csj.mongodb.net/?retryWrites=true&w=majority&appName=smasam`;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@smasam.hmi3csj.mongodb.net/?retryWrites=true&w=majority&tls=true`;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendConfirmationEmail = async (orderData) => {
    try {
        // Check for email in both email and email_1 fields
        const emailField = orderData.email || orderData.email_1;

        if (!orderData || !emailField || typeof emailField !== 'string' || emailField.trim() === '') {
            return { success: false, error: 'No valid email address provided' };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.trim())) {
            return { success: false, error: 'Invalid email format' };
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailField.trim(),
            subject: `Order Confirmed - ${orderData.orderNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Order Confirmation - Smasam Restaurant</h2>
                    
                    <p>Dear ${orderData.name || 'Valued Customer'},</p>
                    
                    <p>Thank you for your order! We're pleased to confirm that your order has been received and confirmed.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #2c3e50; margin-top: 0;">Order Details:</h3>
                        <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                        <p><strong>Order Status:</strong> Confirmed</p>
                        <p><strong>Phone:</strong> ${orderData.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> ${orderData.address || 'N/A'}</p>
                        
                        ${orderData.selectedItems ? `
                            <h4>Items Ordered:</h4>
                            <ul>
                                ${orderData.selectedItems.map(item =>
                `<li>${item.name} - Quantity: ${item.quantity} - £${item.price}</li>`
            ).join('')}
                            </ul>
                            <p><strong>Total Amount:</strong> £${orderData.totalPrice || 'N/A'}</p>
                        ` : ''}
                    </div>
                    
                    <p>We'll notify you once your order is ready for delivery.</p>
                    
                    <p>Thank you for choosing Smasam Restaurant!</p>
                    
                    <hr style="margin: 30px 0;">
                    <p style="color: #7f8c8d; font-size: 12px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return { success: false, error: error.message };
    }
};

const sendDeliveryEmail = async (orderData) => {
    try {
        // Check for email in both possible fields
        const emailField = orderData.email || orderData.email_1;

        if (!orderData || !emailField || typeof emailField !== 'string' || emailField.trim() === '') {
            return { success: false, error: 'No valid email address provided' };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailField.trim())) {
            return { success: false, error: 'Invalid email format' };
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailField.trim(),
            subject: `Order Delivered - ${orderData.orderNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #27ae60;">Order Delivered - Smasam Restaurant</h2>
                    
                    <p>Dear ${orderData.name || 'Valued Customer'},</p>
                    
                    <p>Great news! Your order has been successfully delivered.</p>
                    
                    <div style="background-color: #d5f4e6; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="color: #27ae60; margin-top: 0;">Delivery Confirmation:</h3>
                        <p><strong>Order Number:</strong> ${orderData.orderNumber}</p>
                        <p><strong>Status:</strong> Delivered</p>
                        <p><strong>Delivered to:</strong> ${orderData.address || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${orderData.phone || 'N/A'}</p>
                        
                        ${orderData.selectedItems ? `
                            <h4>Items Delivered:</h4>
                            <ul>
                                ${orderData.selectedItems.map(item =>
                `<li>${item.name} - Quantity: ${item.quantity} - £${item.price}</li>`
            ).join('')}
                            </ul>
                            <p><strong>Total Amount:</strong> £${orderData.totalPrice || 'N/A'}</p>
                        ` : ''}
                    </div>
                    
                    <p>We hope you enjoy your meal! Thank you for choosing Smasam Restaurant.</p>
                    
                    <p>Please feel free to contact us if you have any questions or feedback.</p>
                    
                    <hr style="margin: 30px 0;">
                    <p style="color: #7f8c8d; font-size: 12px;">
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending delivery email:', error);
        return { success: false, error: error.message };
    }
};

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
        const persianCollection = client.db('smasam_backend').collection('persiann')
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
            // count total orders to generate unique order number
            const count = await afghanCollection.countDocuments();
            // add extra fields before inserting
            const newOrder = {
                ...data,
                orderNumber: `smasam/afghan-${(count + 1).toString().padStart(3, "0")}`,
                orderStatus: "Pending",
                lastUpdate: "Not Delivered",
                // sendin mail through n8n 
                isDeliveredMsg: false,
                isConfirmMsg: false,
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

                // Get the current order data before updating
                const currentOrder = await afghanCollection.findOne({ _id: new ObjectId(id) });

                if (!currentOrder) {
                    return res.status(404).send({ success: false, message: "Order not found" });
                }

                // Check if order status is being changed from "Pending" to "Confirmed"
                const isStatusChangingToConfirmed =
                    currentOrder.orderStatus === "Pending" &&
                    updateData.orderStatus === "Confirmed";

                // Check if lastUpdate is being changed to "Delivered"
                const isStatusChangingToDelivered =
                    currentOrder.lastUpdate !== "Delivered" &&
                    updateData.lastUpdate === "Delivered";

                const result = await afghanCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    const updatedOrder = { ...currentOrder, ...updateData };
                    let emailResults = [];

                    // If status changed to confirmed, send confirmation email
                    if (isStatusChangingToConfirmed) {
                        const emailResult = await sendConfirmationEmail(updatedOrder);
                        emailResults.push({ type: 'confirmation', ...emailResult });

                        if (emailResult.success) {
                            // Update the isConfirmMsg flag
                            await afghanCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isConfirmMsg: true } }
                            );
                        }
                    }

                    // If status changed to delivered, send delivery email
                    if (isStatusChangingToDelivered) {
                        const emailResult = await sendDeliveryEmail(updatedOrder);
                        emailResults.push({ type: 'delivery', ...emailResult });

                        if (emailResult.success) {
                            // Update the isDeliveredMsg flag
                            await afghanCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isDeliveredMsg: true } }
                            );
                        }
                    }

                    res.send({
                        success: true,
                        message: "Order updated successfully",
                        emailResults: emailResults
                    });
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
        app.post("/persian", async (req, res) => {
            const data = req.body;
            // count total orders to generate unique order number
            const count = await persianCollection.countDocuments();
            // add extra fields before inserting
            const newOrder = {
                ...data,
                orderNumber: `smasam/persian-${(count + 1).toString().padStart(3, "0")}`,
                orderStatus: "Pending",
                lastUpdate: "Not Delivered",
                isDeliveredMsg: false,
                isConfirmMsg: false,
            };
            const result = await persianCollection.insertOne(newOrder);
            res.send(result);
        });

        // get persian data
        app.get('/persian', async (req, res) => {
            const result = await persianCollection.find().toArray();
            res.send(result);
        });



        // put request for persian menu 
        app.put("/persian/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;

                // Get the current order data before updating
                const currentOrder = await persianCollection.findOne({ _id: new ObjectId(id) });

                if (!currentOrder) {
                    console.log('❌ Order not found:', id);
                    return res.status(404).send({ success: false, message: "Order not found" });
                }

                // Check if order status is being changed from "Pending" to "Confirmed" or "Confirm"
                const isStatusChangingToConfirmed =
                    currentOrder.orderStatus === "Pending" &&
                    (updateData.orderStatus === "Confirmed" || updateData.orderStatus === "Confirm");

                // Check if lastUpdate is being changed to "Delivered"
                const isStatusChangingToDelivered =
                    currentOrder.lastUpdate !== "Delivered" &&
                    updateData.lastUpdate === "Delivered";


                const result = await persianCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    const updatedOrder = { ...currentOrder, ...updateData };
                    let emailResults = [];

                    // If status changed to confirmed, send confirmation email
                    if (isStatusChangingToConfirmed) {
                        const emailResult = await sendConfirmationEmail(updatedOrder);
                        emailResults.push({ type: 'confirmation', ...emailResult });

                        if (emailResult.success) {
                            // Update the isConfirmMsg flag
                            await persianCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isConfirmMsg: true } }
                            );
                        }
                    }

                    // If status changed to delivered, send delivery email
                    if (isStatusChangingToDelivered) {
                        const emailResult = await sendDeliveryEmail(updatedOrder);
                        emailResults.push({ type: 'delivery', ...emailResult });

                        if (emailResult.success) {
                            // Update the isDeliveredMsg flag
                            await persianCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isDeliveredMsg: true } }
                            );
                        }
                    }

                    res.send({
                        success: true,
                        message: "Order updated successfully",
                        emailResults: emailResults
                    });
                } else {
                    res.status(404).send({ success: false, message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating order:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });






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
                isDeliveredMsg: false,
                isConfirmMsg: false,
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

                // Get the current order data before updating
                const currentOrder = await indianCollection.findOne({ _id: new ObjectId(id) });

                if (!currentOrder) {
                    console.log('❌ Order not found:', id);
                    return res.status(404).send({ success: false, message: "Order not found" });
                }

                // Check if order status is being changed from "Pending" to "Confirmed" or "Confirm"
                const isStatusChangingToConfirmed =
                    currentOrder.orderStatus === "Pending" &&
                    (updateData.orderStatus === "Confirmed" || updateData.orderStatus === "Confirm");

                // Check if lastUpdate is being changed to "Delivered"
                const isStatusChangingToDelivered =
                    currentOrder.lastUpdate !== "Delivered" &&
                    updateData.lastUpdate === "Delivered";

                const result = await indianCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    const updatedOrder = { ...currentOrder, ...updateData };
                    let emailResults = [];

                    // If status changed to confirmed, send confirmation email
                    if (isStatusChangingToConfirmed) {
                        const emailResult = await sendConfirmationEmail(updatedOrder);
                        emailResults.push({ type: 'confirmation', ...emailResult });

                        if (emailResult.success) {
                            // Update the isConfirmMsg flag
                            await indianCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isConfirmMsg: true } }
                            );
                        }
                    }

                    // If status changed to delivered, send delivery email
                    if (isStatusChangingToDelivered) {
                        const emailResult = await sendDeliveryEmail(updatedOrder);
                        emailResults.push({ type: 'delivery', ...emailResult });

                        if (emailResult.success) {
                            // Update the isDeliveredMsg flag
                            await indianCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isDeliveredMsg: true } }
                            );
                        }
                    }

                    res.send({
                        success: true,
                        message: "Order updated successfully",
                        emailResults: emailResults
                    });
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
                isDeliveredMsg: false,
                isConfirmMsg: false,
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

                // Get the current order data before updating
                const currentOrder = await lambCollection.findOne({ _id: new ObjectId(id) });

                if (!currentOrder) {
                    console.log('❌ Order not found:', id);
                    return res.status(404).send({ success: false, message: "Order not found" });
                }

                // Check if order status is being changed from "Pending" to "Confirmed" or "Confirm"
                const isStatusChangingToConfirmed =
                    currentOrder.orderStatus === "Pending" &&
                    (updateData.orderStatus === "Confirmed" || updateData.orderStatus === "Confirm");

                // Check if lastUpdate is being changed to "Delivered"
                const isStatusChangingToDelivered =
                    currentOrder.lastUpdate !== "Delivered" &&
                    updateData.lastUpdate === "Delivered";

                const result = await lambCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    const updatedOrder = { ...currentOrder, ...updateData };
                    let emailResults = [];

                    // If status changed to confirmed, send confirmation email
                    if (isStatusChangingToConfirmed) {
                        const emailResult = await sendConfirmationEmail(updatedOrder);
                        emailResults.push({ type: 'confirmation', ...emailResult });

                        if (emailResult.success) {
                            // Update the isConfirmMsg flag
                            await lambCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isConfirmMsg: true } }
                            );
                        }
                    }

                    // If status changed to delivered, send delivery email
                    if (isStatusChangingToDelivered) {
                        const emailResult = await sendDeliveryEmail(updatedOrder);
                        emailResults.push({ type: 'delivery', ...emailResult });

                        if (emailResult.success) {
                            // Update the isDeliveredMsg flag
                            await lambCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isDeliveredMsg: true } }
                            );
                        }
                    }

                    res.send({
                        success: true,
                        message: "Order updated successfully",
                        emailResults: emailResults
                    });
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
                isDeliveredMsg: false,
                isConfirmMsg: false,
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

                // Get the current order data before updating
                const currentOrder = await takeAwayCollection.findOne({ _id: new ObjectId(id) });

                if (!currentOrder) {
                    console.log('❌ Order not found:', id);
                    return res.status(404).send({ success: false, message: "Order not found" });
                }

                console.log('📄 Current order found:', JSON.stringify(currentOrder, null, 2));

                // Check if order status is being changed from "Pending" to "Confirmed" or "Confirm"
                const isStatusChangingToConfirmed =
                    currentOrder.orderStatus === "Pending" &&
                    (updateData.orderStatus === "Confirmed" || updateData.orderStatus === "Confirm");

                // Check if lastUpdate is being changed to "Delivered"
                const isStatusChangingToDelivered =
                    currentOrder.lastUpdate !== "Delivered" &&
                    updateData.lastUpdate === "Delivered";

                const result = await takeAwayCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    const updatedOrder = { ...currentOrder, ...updateData };
                    let emailResults = [];

                    // If status changed to confirmed, send confirmation email
                    if (isStatusChangingToConfirmed) {
                        const emailResult = await sendConfirmationEmail(updatedOrder);
                        emailResults.push({ type: 'confirmation', ...emailResult });

                        if (emailResult.success) {
                            // Update the isConfirmMsg flag
                            await takeAwayCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isConfirmMsg: true } }
                            );
                        }
                    }

                    // If status changed to delivered, send delivery email
                    if (isStatusChangingToDelivered) {
                        const emailResult = await sendDeliveryEmail(updatedOrder);
                        emailResults.push({ type: 'delivery', ...emailResult });

                        if (emailResult.success) {
                            // Update the isDeliveredMsg flag
                            await takeAwayCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isDeliveredMsg: true } }
                            );
                        }
                    }

                    res.send({
                        success: true,
                        message: "Order updated successfully",
                        emailResults: emailResults
                    });
                } else {
                    res.status(404).send({ success: false, message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating order:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });


        // takeaway end ---------------------------


        // lunch start 

        //post api for lunch
        app.post("/lunch", async (req, res) => {
            const data = req.body;
            console.log(data)
            // count total orders to generate unique order number
            const count = await lunchCollection.countDocuments();
            // add extra fields before inserting
            const newOrder = {
                ...data,
                orderNumber: `smasam/lunch-${(count + 1).toString().padStart(3, "0")}`,
                orderStatus: "Pending",
                lastUpdate: "Not Delivered",
                isDeliveredMsg: false,
                isConfirmMsg: false,
            };
            const result = await lunchCollection.insertOne(newOrder);
            res.send(result);
        });


        // get lunch data
        app.get('/lunch', async (req, res) => {
            const result = await lunchCollection.find().toArray();
            res.send(result);
        });

        app.put("/lunch/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const updateData = req.body;

                // Get the current order data before updating
                const currentOrder = await lunchCollection.findOne({ _id: new ObjectId(id) });

                if (!currentOrder) {
                    console.log('❌ Order not found:', id);
                    return res.status(404).send({ success: false, message: "Order not found" });
                }



                // Check if order status is being changed from "Pending" to "Confirmed" or "Confirm"
                const isStatusChangingToConfirmed =
                    currentOrder.orderStatus === "Pending" &&
                    (updateData.orderStatus === "Confirmed" || updateData.orderStatus === "Confirm");

                // Check if lastUpdate is being changed to "Delivered"
                const isStatusChangingToDelivered =
                    currentOrder.lastUpdate !== "Delivered" &&
                    updateData.lastUpdate === "Delivered";

                const result = await lunchCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    const updatedOrder = { ...currentOrder, ...updateData };
                    let emailResults = [];

                    // If status changed to confirmed, send confirmation email
                    if (isStatusChangingToConfirmed) {
                        const emailResult = await sendConfirmationEmail(updatedOrder);
                        emailResults.push({ type: 'confirmation', ...emailResult });

                        if (emailResult.success) {
                            // Update the isConfirmMsg flag
                            await lunchCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isConfirmMsg: true } }
                            );
                        }
                    }

                    // If status changed to delivered, send delivery email
                    if (isStatusChangingToDelivered) {
                        const emailResult = await sendDeliveryEmail(updatedOrder);
                        emailResults.push({ type: 'delivery', ...emailResult });

                        if (emailResult.success) {
                            // Update the isDeliveredMsg flag
                            await lunchCollection.updateOne(
                                { _id: new ObjectId(id) },
                                { $set: { isDeliveredMsg: true } }
                            );
                        }
                    }

                    res.send({
                        success: true,
                        message: "Order updated successfully",
                        emailResults: emailResults
                    });
                } else {
                    res.status(404).send({ success: false, message: "Order not found" });
                }
            } catch (error) {
                console.error("Error updating order:", error);
                res.status(500).send({ success: false, message: "Internal Server Error" });
            }
        });



        //get data  endpoit 


















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


