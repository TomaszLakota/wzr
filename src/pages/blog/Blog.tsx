import { useState, useEffect } from 'react';
import ArticlePreview from '../../components/article-preview/ArticlePreview';
import './Blog.scss';
import { Article } from '../../types/article.types';

function Blog() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/articles')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data) => {
        setArticles(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching articles:', error);
        setError('Nie udało się załadować artykułów.');
        setLoading(false);
      });
  }, []);

  return (
    <div className="blog-container page-container-medium">
      <h1>Blog</h1>
      {loading && <p className="loading-message">Ładowanie...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && articles.length === 0 && (
        <p className="no-articles">Brak dostępnych artykułów.</p>
      )}
      {!loading && !error && articles.length > 0 && (
        <div className="articles-list">
          {articles.map((article) => (
            <ArticlePreview key={article.slug} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Blog;
