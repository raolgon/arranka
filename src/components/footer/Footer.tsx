import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="w-full bg-base-300 text-base-content">
            <div className="container mx-auto">
                <div className="footer footer-center p-4">
                    <div>
                        <p>&copy; {new Date().getFullYear()} arranke</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;