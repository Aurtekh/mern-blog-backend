import express from 'express';
import getFs from '@cyclic.sh/s3fs';
import multer from 'multer';
import mongoose from 'mongoose';
import cors from 'cors';
import AWS from 'aws-sdk';
const s3 = new AWS.S3();

const fs = getFs(process.env.CYCLIC_BUCKET_NAME);

import { registerValidation, loginValidation, postCreateValidation } from './validations.js';

import { UserController, PostController } from './controllers/index.js';
import { checkAuth, handleValidationErrors } from './utils/index.js';

mongoose.set('strictQuery', false);
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('DB OK');
  })
  .catch((err) => {
    console.log('DB error', err);
  });
const app = express();

const upload = app.put('*', async (req, res) => {
  let filename = req.path.slice(1);

  console.log(typeof req.body);

  await s3
    .putObject({
      Body: JSON.stringify(req.body),
      Bucket: process.env.CYCLIC_BUCKET_NAME,
      Key: filename,
    })
    .promise();

  res.set('Content-type', 'text/plain');
  res.send('ok').end();
});

// const storage = multer.diskStorage({
//   destination: (_, __, cb) => {
//     if (!fs.exists(process.env.CYCLIC_BUCKET_NAME)) {
//       fs.mkdir(process.env.CYCLIC_BUCKET_NAME);
//     }
//     cb(null, process.env.CYCLIC_BUCKET_NAME);
//   },
//   filename: (_, file, cb) => {
//     cb(null, file.originalname);
//   },
// });

// const upload = multer({ storage });

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.post('/auth/login', loginValidation, handleValidationErrors, UserController.login);
app.post('/auth/register', registerValidation, handleValidationErrors, UserController.register);
app.get('/auth/me', checkAuth, UserController.getMe);

app.post('/upload', checkAuth, upload, (req, res) => {
  res.json({
    url: `/uploads/${req.file.originalname}`,
  });
});
app.get('/tags', PostController.getLastTags);
app.get('/posts', PostController.getAll);
app.get('/posts/tags', PostController.getLastTags);
app.get('/posts/:id', PostController.getOne);
app.post('/posts', checkAuth, postCreateValidation, handleValidationErrors, PostController.create);
app.delete('/posts/:id', checkAuth, PostController.remove);
app.patch(
  '/posts/:id',
  checkAuth,
  postCreateValidation,
  handleValidationErrors,
  PostController.update,
);

app.listen(process.env.PORT || 4444, (err) => {
  if (err) {
    return console.log(err);
  }
  console.log('Server Ok');
});
