import { uk } from '../i18n/uk.js';

export default function MockBanner() {
  return (
    <div className="mock-banner" role="alert">
      <span className="mock-banner-tag">{uk.mock.bannerTitle}</span>
      <span className="mock-banner-text">
        {uk.mock.bannerBody}
        <code>{uk.mock.bannerCode}</code>
      </span>
    </div>
  );
}
