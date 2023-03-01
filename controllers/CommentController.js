import CommentModel from '../models/Comment.js';

export const create = async (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://mern-blog-frontend-mauve.vercel.app');
  try {
    const doc = new CommentModel({
      text: req.body.text,
      user: req.userId,
      post: req.params.id,
    });

    const comment = await doc.save();

    res.json(comment);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось написать комментарий',
    });
  }
};

export const getLastComments = async (req, res) => {
  try {
    const comments = await CommentModel.find().limit(5).populate('user').exec();

    res.json(comments);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось получить статью',
    });
  }
};

export const getThisPostComments = async (req, res) => {
  try {
    const postId = req.params.id;
    const comments = await CommentModel.find({ post: { $in: postId } })
      .populate('user')
      .exec();

    res.json(comments);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось получить статью',
    });
  }
};
