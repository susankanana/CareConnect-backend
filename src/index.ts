import './types/global.types';
import express from 'express';
import user from './auth/auth.router';
import doctor from './doctor/doctor.router';
import appointment from './appointment/appointment.router';
import prescription from './prescription/prescription.router';
import complaint from './complaint/complaint.router';

const app = express();
app.use(express.json()); //used to parse JSON bodies

// routes
user(app);
doctor(app);
appointment(app);
prescription(app);
complaint(app);


app.get('/', (req, res) => {
    res.send('Hello, World!');
})

app.listen(8081, () => {
    console.log('Server is running on http://localhost:8081');
}) 