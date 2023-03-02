import CommentModel from '../models/Comment.js';

export const create = async (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  try {
    const doc = new CommentModel({
      text: req.body.text,
      user: req.body.user,
      post: req.body.post,
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

export const getAllComments = async (req, res) => {
  try {
    const comments = await CommentModel.find().populate('user').exec();

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

export const remove = async (req, res) => {
  try {
    const commentId = req.params.id;

    CommentModel.findOneAndDelete(
      {
        _id: commentId,
      },
      (err, doc) => {
        if (err) {
          console.log(err);
          return res.status(500).json({
            message: 'Не удалось удалить комментарий',
          });
        }

        if (!doc) {
          console.log(err);
          return res.status(404).json({
            message: 'Комментарий не найден',
          });
        }
      },
    );

    res.json({
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось удалить комментарий',
    });
  }
};
