import React from 'react';
import { Link } from 'react-router-dom';
import './ArticlePreview.scss';

interface Article {
  slug: string;
  title: string;
  preview: string;
}

interface ArticlePreviewProps {
  article?: Article; // Made optional based on the null check
}

const ArticlePreview: React.FC<ArticlePreviewProps> = ({ article }) => {
  if (!article) {
    return null;
  }

  return (
    <div className="article-preview">
      <h2>
        <Link to={`/blog/${article.slug}`}>{article.title}</Link>
      </h2>
      <p>{article.preview}</p>
    </div>
  );
};

export default ArticlePreview;
