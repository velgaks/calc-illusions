import { Link } from 'react-router-dom';
import { uk } from '../i18n/uk.js';

export default function MockBanner({ level = 'demo' }) {
  if (level === 'partial') {
    return (
      <div className="mock-banner mock-banner-partial" role="alert">
        <span className="mock-banner-tag">{uk.mock.partialTitle}</span>
        <span className="mock-banner-text">
          {uk.mock.partialBody}
          <Link to="/methodology">{uk.mock.partialLink}</Link>.
        </span>
      </div>
    );
  }
  return (
    <div className="mock-banner" role="alert">
      <span className="mock-banner-tag">{uk.mock.demoTitle}</span>
      <span className="mock-banner-text">
        {uk.mock.demoBody}
        <code>{uk.mock.demoCode}</code>
      </span>
    </div>
  );
}
