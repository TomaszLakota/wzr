import React, { useState, useEffect } from 'react';
// import ArticleDetail from '../components/article-detail/ArticleDetail';
import ArticlePreview from '../components/article-preview/ArticlePreview';

function Blog() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    <div>
      <h1>Blog</h1>
      {loading && <p>Ładowanie...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!loading && !error && (
        <div>
          {articles.map((article) => {
            // console.log(article.slug);
            return <ArticlePreview key={article.slug} article={article} />;
          })}
        </div>
      )}
    </div>
  );
}

export default Blog;
