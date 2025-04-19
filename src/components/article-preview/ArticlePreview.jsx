import React from 'react';
import { Link } from 'react-router-dom';
import './ArticlePreview.scss';

function ArticlePreview({ article }) {
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
}

export default ArticlePreview; 