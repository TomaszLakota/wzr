import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ArticleDetail.scss';

function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/articles/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Artykuł nie został znaleziony.');
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }
        const data = await response.json();
        setArticle(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return <div className="article-loading">Ładowanie artykułu...</div>;
  }

  if (error) {
    return <div className="article-error">Błąd: {error}</div>;
  }

  if (!article) {
    return <div className="article-not-found">Nie znaleziono artykułu.</div>; // Should ideally not be reached if 404 error is caught
  }

  const paragraphs = article.content.split('\\n\\n');

  return (
    <div className="article-detail-container">
      <h1>{article.title}</h1>
      <div className="article-content">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph.replace(/\n/g, ' ')}</p>
        ))}
      </div>
    </div>
  );
}

export default ArticleDetail;
