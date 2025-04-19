import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './ArticleDetail.scss';

// Define the structure of the fetched article
interface Article {
  title: string;
  content: string;
  // Add other potential fields if they exist
}

const ArticleDetail: React.FC = () => {
  // Type the slug from useParams (it can be undefined)
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ensure slug exists before fetching
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
        // Assume the API returns data conforming to the Article interface
        const data: Article = await response.json();
        setArticle(data);
      } catch (err) {
        // Type assertion for error message
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

  if (loading) {
    return <div className="article-loading">Ładowanie artykułu...</div>;
  }

  if (error) {
    return <div className="article-error">Błąd: {error}</div>;
  }

  if (!article) {
    // This case might be hit if the API returns success but no data, or if slug was initially missing
    return <div className="article-not-found">Nie znaleziono artykułu.</div>;
  }

  // Splitting content - ensure content exists before splitting
  const paragraphs = article.content ? article.content.split('\n\n') : [];

  return (
    <div className="article-detail-container">
      <h1>{article.title}</h1>
      <div className="article-content">
        {paragraphs.map((paragraph, index) => (
          // Process paragraph content safely
          <p key={index}>{paragraph.replace(/\n/g, ' ')}</p>
        ))}
      </div>
    </div>
  );
};

export default ArticleDetail;
