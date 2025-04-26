import React from 'react';
import { Link } from 'react-router-dom';
import './ArticlePreview.scss';
import { Article } from '../../types/article.types';



export interface ArticlePreviewProps {
  article: Article;
}

const ArticlePreview: React.FC<ArticlePreviewProps> = ({ article }) => {
  if (!article) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="article-preview">
      <h2>
        <Link to={`/blog/${article.slug}`}>{article.title}</Link>
      </h2>
      <div className="article-date">{formatDate(article.created_at)}</div>
      <p>{article.preview}</p>
    </div>
  );
};

export default ArticlePreview;
