import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ArticleDetail.scss';
import { Article } from '../../types/article.types';

const ArticleDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setError('Nie znaleziono identyfikatora artykułu (slug).');
      setLoading(false);
      return;
    }

    const fetchArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/articles/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Artykuł nie został znaleziony.');
          } else {
            // Throwing error correctly
            throw new Error(`Błąd HTTP: ${response.status}`);
          }
        }
        const data: Article = await response.json();
        setArticle(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Wystąpił nieznany błąd podczas ładowania artykułu.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]); // Dependency array remains the same

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (error) {
    return <div className="article-error">Błąd: {error}</div>;
  }

  if (!article) {
    if (loading) {
      return;
    }
    return <div className="article-not-found">Nie znaleziono artykułu.</div>;
  }

  const paragraphs = article.content ? article.content.split('\n\n') : [];

  return (
    <div className="article-detail-container">
      <h1>{article.title}</h1>
      <div className="article-date">{formatDate(article.created_at)}</div>
      <div className="article-content">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph.replace(/\n/g, ' ')}</p>
        ))}
      </div>
    </div>
  );
};

export default ArticleDetail;
