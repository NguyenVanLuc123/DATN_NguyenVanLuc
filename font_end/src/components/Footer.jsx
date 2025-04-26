import { FaCar } from "react-icons/fa";

function Footer() {
  return (
    <footer className="bg-green-800 text-white py-12">
      {/* Container */}
      <div className="max-w-6xl mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Column 1: Logo and Description */}
        <div className="space-y-4">
          <div className="flex flex-row items-center gap-2 text-xl font-semibold">
            <FaCar size={50} />
            Rent car today!
          </div>
          <p className="text-sm leading-relaxed text-green-200">
            We have a large selection of locally owned cars available for you to
            choose from. Rental plans are customized to suit your needs.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h4 className="text-lg font-semibold text-green-100 mb-4">Quick</h4>
          <ul className="space-y-2">
            <li>
              <a
                href="/"
                className="text-green-300 hover:text-white transition"
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="/lessons"
                className="text-green-300 hover:text-white transition"
              >
                Lessons
              </a>
            </li>
            <li>
              <a
                href="/quizzes"
                className="text-green-300 hover:text-white transition"
              >
                Quizzes
              </a>
            </li>
            <li>
              <a
                href="/notebooks"
                className="text-green-300 hover:text-white transition"
              >
                Notebooks
              </a>
            </li>
          </ul>
        </div>

        {/* Column 3: Contact Info */}
        <div>
          <h4 className="text-lg font-semibold text-green-100 mb-4">
            Contact Us
          </h4>
          <p className="text-green-200 text-sm">
            Email:{" "}
            <a
              href="mailto:support@elgand.com"
              className="text-green-300 hover:text-white transition"
            >
              support@elgand.com
            </a>
          </p>
          <p className="text-green-200 text-sm">
            Phone:{" "}
            <a
              href="tel:+123456789"
              className="text-green-300 hover:text-white transition"
            >
              +1 234 567 89
            </a>
          </p>
          <p className="mt-4 text-green-200 text-sm">Follow us on:</p>
          <div className="flex gap-4 mt-2">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 hover:text-white transition"
            >
              Facebook
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 hover:text-white transition"
            >
              Twitter
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-300 hover:text-white transition"
            >
              Instagram
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="mt-8 border-t border-green-700 pt-6 text-center">
        <p className="text-green-200 text-sm">
          © {new Date().getFullYear()} Rent. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
