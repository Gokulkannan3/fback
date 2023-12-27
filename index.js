    const express = require('express');
    const mysql = require('mysql');
    const app = express();
    const cors =require('cors');
    const bcrypt = require('bcrypt');
    const setRounds=10;

    app.use(express.json());
    app.use(cors());

    const db = mysql.createConnection({
        user:'admin',
        password:'Gokul2003',
        host:'database-1.cfywi26s6zwq.us-east-2.rds.amazonaws.com',
        database:'Innumvai'
    })

    app.post('/order',(req,res)=>{
        const user = req.body?.user;
        const address = req.body?.address;
        const coffee = req.body?.coffee;
        const pasta = req.body?.pasta;
        const rosemilk = req.body?.rosemilk;
        const brownie = req.body?.brownie;
        const cake =req.body?.cake;
        const status = ('Booked');

        console.log(req.body);

        db.query('INSERT INTO orders (user,address,coffee,pasta,rosemilk,brownie,cake,status) VALUES (?,?,?,?,?,?,?,?)',[user,address,coffee,pasta,rosemilk,brownie,cake,status],
        (err,result)=>{
            if(err){
                console.log(err);
            }
            else{
                res.send(result);
            }
        }
        )
    })

    app.post('/register', (req, res) => {
        const firstname = req.body?.firstname;
        const lastname = req.body?.lastname;
        const dob = req.body?.dob;
        const age = req.body?.age;
        const email = req.body?.email;
        const contact = req.body?.contact;
        const address = req.body?.address;
        const username =req.body?.username;
        const password = req.body?.password;
        const cpassword = req.body?.cpassword;

        console.log(req.body);

        if (password !== cpassword) {
            return res.status(400).json({ error: 'Password and Confirm Password do not match' });
        }

        bcrypt.hash(password,setRounds,(err,hash)=>{
            if(err){
                console.log(err)
            }

            db.query('INSERT INTO signin(firstname, lastname, dob, age, email, contact, address, username, password, cpassword) VALUES (?,?,?,?,?,?,?,?,?,?)',
            [firstname, lastname, dob, age, email, contact, address, username, hash, hash],
            (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    console.log(result);
                    return res.status(200).json({ message: 'Registration Successful' });
                }
            }
        );
        })
    });

    app.put('/updateStatus/:id', (req, res) => {
        const orderId = req.params?.id;
        const newStatus = req.body?.newStatus;
    
        db.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          [newStatus, orderId],
          (err, result) => {
            if (err) {
              console.log(err);
              res.status(500).json({ error: 'Internal Server Error' });
            } else {
              if (result.affectedRows > 0) {
                console.log(result);
                res.status(200).json({ message: 'Status updated successfully' });
              } else {
                res.status(404).json({ message: 'Order not found' });
              }
            }
          }
        );
    });
    
      
      

    app.post('/aregister', (req, res) => {
        const name = req.body?.name;
        const password = req.body?.password;
        const cpassword = req.body?.cpassword;

        console.log(req.body);

        if (password !== cpassword) {
            return res.status(400).json({ error: 'Password and Confirm Password do not match' });
        }

        bcrypt.hash(password,setRounds,(err,hash)=>{
            if(err){
                console.log(err)
            }

            db.query('INSERT INTO admin(name, password, cpassword) VALUES (?,?,?)',
            [name, hash, hash],
            (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    console.log(result);
                    return res.status(200).json({ message: 'Registration Successful' });
                }
            }
        );
        })
    });

    app.post('/login', async (req, res) => {
        const username = req.body?.username;
        const password = req.body?.password;
    
        db.query(
            "SELECT * FROM signin WHERE username=?",
            [username],
            (err, result) => {
                if (err) {
                    console.log("Success");
                    res.send(result);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
    
                if (result.length > 0) {
                    bcrypt.compare(password, result[0].password, (err, response) => {
                        if (response) {
                            const userData = {
                                username: result[0].username,
                                address: result[0].address,
                            };
    
                            res.status(200).json({ message: 'Login Successful', userData });
                        } else {
                            res.status(401).json({ message: 'Invalid Credentials' });
                        }
                    });
                } else {
                    res.status(401).json({ message: 'Invalid Credentials' });
                }
            }
        );
    });

    app.post('/alogin', async (req, res) => {
        const name = req.body?.name;
        const password = req.body?.password;
    
        db.query(
            "SELECT * FROM admin WHERE name=?",
            [name],
            (err, result) => {
                if (err) {
                    console.log("Success");
                    res.send(result);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
    
                if (result.length > 0) {
                    bcrypt.compare(password, result[0].password, (err, response) => {
                        if (response) {
                            const userData = {
                                name: result[0].name,
                                address: result[0].address,
                            };
    
                            res.status(200).json({ message: 'Login Successful', userData });
                        } else {
                            res.status(401).json({ message: 'Invalid Credentials' });
                        }
                    });
                } else {
                    res.status(401).json({ message: 'Invalid Credentials' });
                }
            }
        );
    });

    app.get('/order' , (req,res) => {
        db.query("SELECT * FROM orders", 
        (err,result)=>{
            if(err)
            {
                console.log(err);
            }
            else{
                res.send(result);
            }
        }
        )
    })
    
    


    app.listen(3002,()=>{
        console.log('Server started');
    });
