import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';


const SECRET_KEY = "NOTESAPI";
const app = express();
const port = 4000;

dotenv.config();
app.use(cors());



const pass = process.env.MONGO_PASS;
app.use(express.json());




mongoose
    .connect(`mongodb+srv://harsh:${pass}@harsh-singh.yo9whrd.mongodb.net/CustomerD?retryWrites=true&w=majority`)
    .then(() => console.log(`Connected to The MongoDB`))
    .catch((err) => console.log("error found", err));

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    username: {
        type: String,
        require: true
    }
});
const userModel = mongoose.model('user', userSchema);

const customerSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    position : String,
    level : String,
    address: String,
    date : String,
    about : String,
});
const CustomerModel = mongoose.model('customer', customerSchema);



// Sign up function ---------------------------------------------------------------------------------
async function signup(req, res) {
    const { username, email, pass } = req.body;
    try {
        const existingUser = await userModel.findOne({ email: email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashPassword = await bcrypt.hash(pass, 10);
        const result = await userModel.create({
            email: email,
            password: hashPassword,
            username: username,
        });
        const token = jwt.sign({ email: result.email, id: result._id }, SECRET_KEY);
        res.status(200).json({ user: result, token: token });
    }
    catch (error) {
        console.log("error");
        alert("some problem with mongoDb");
        res.status(500).json({ message: "Somthing went wrong", error });
    }
}

// Login function ----------------------------------------------------------------------------
async function signin(req, res) {
    const { email, pass } = req.body;
    try {
        const existingUser = await userModel.findOne({ email: email });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }
        const matchPassword = await bcrypt.compare(pass, existingUser.password);
        if (!matchPassword) {
            return res.status(400).json({ message: "Invalid Credentials" });

        }
        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, SECRET_KEY);
        res.status(200).json({ user: existingUser, token: token });
    }
    catch (error) {
        console.log("error");
        alert("some problem rise");
        res.status(500).json({ message: "Somthing went wrong" });
    }
}
//------------------------------------------------------------------------------------------------------------


//------Post Method---------Customer Registration -----------------------------------//
async function registration(req, res) {
    const { name, email, phone,pos,lev, address,date,about } = req.body;
    console.log(name, email, phone, address);
    try {
        const result = await CustomerModel.create({
            name: name,
            email: email,
            phone: phone,
            position : pos,
            Level : lev,
            address: address,
            date : date,
            about : about
        });
        res.status(200).json(result);
    }
    catch (error) {
        console.log("Error found");
    }
}

//=========================Get Data ================== Costomer.................
async function getData(req, res) {
    try {
        const users = await CustomerModel.find();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

//------------------------Pagination ------------------
async function getDataP(req, res) {
    const { limit, page } = req.body;
  
    try {
      const totalCount = await CustomerModel.countDocuments();
      const totalPages = Math.ceil(totalCount / limit);
  
      const users = await CustomerModel.find()
        .skip((page - 1) * limit)
        .limit(limit);
  
      res.status(200).json({
        users,
        page,
        totalPages,
        totalCount,
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
//========================Search Customer =====================

async function searchCustomer(req, res) {
console.log(req.params.k);
    try {
      const customers = await CustomerModel.find({
        "$or": [
          { "name": { $regex: req.params.k ,$options: 'i'} },
          { "email": { $regex: req.params.k,$options: 'i'} },
          { "phone": { $regex: req.params.k }},
        ],
      });
      res.json(customers);
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  



//========================Update Data ====================== Customer...............


    async function updateCustomer(req, res) {
        const customerId = req.params.id;
        const updatedCustomer = req.body;

        console.log(customerId);
        console.log(updatedCustomer);
      
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
          return res.status(400).json({ message: 'Invalid customer ID' });
        }
      
        try {
          const customer = await CustomerModel.findOneAndUpdate(
            { _id: customerId },
            updatedCustomer,
            { new: true }
          );
      
          if (customer) {
            res.json(customer);
          } else {
            res.status(404).json({ message: 'Customer not found' });
          }
        } catch (error) {
          console.error('Error:', error);
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }

//=========================Delete Data ================== Customer---------------
async function deleteCustomer(req,res){
    console.log(req.body);
    try{
        const result = await CustomerModel.deleteOne({});
        res.status(200).json(result);
       
    }
    catch(error){
        console.log("Error", error);
        res.status(500).json({error : " Internal Server Error"});
    }
}
//--------------------------------------------------------------------------------------------------------
app.get('/', (req, res) => {
    res.send("hello guys..");
})

app.post('/signup', signup);
app.post('/signin', signin);

app.post('/customer', registration);
app.get('/getcust',getData);
app.get('/pagi',getDataP);

app.put('/update/:id',updateCustomer);

app.delete('/delete',deleteCustomer);

app.get('/search/:k',searchCustomer);




app.listen(port, () => {
    console.log("server is started");
});
