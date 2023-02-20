import express from 'express';
import getFs from '@cyclic.sh/s3fs';
import multer from 'multer';
import mongoose from 'mongoose';
import cors from 'cors';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

const s3 = new S3Client();

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

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    if (!fs.exists('uploads')) {
      fs.mkdir('uploads');
    }
    cb(null, 'uploads');
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'uploads',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, Date.now().toString());
    },
  }),
});

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.post('/auth/login', loginValidation, handleValidationErrors, UserController.login);
app.post('/auth/register', registerValidation, handleValidationErrors, UserController.register);
app.get('/auth/me', checkAuth, UserController.getMe);

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
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
