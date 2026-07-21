import React from "react";
import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <footer className="px-6 md:px-16 lg:px-36 mt-40 w-full text-gray-400 border-t border-white/5">
      <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-white/10 py-14">
        <div className="md:max-w-96">
          <img
            className="w-36 h-auto opacity-90"
            src={assets.logo}
            alt="logo"
          />
          <p className="mt-6 text-sm leading-relaxed text-gray-400">
            Lorem Ipsum has been the industry's standard dummy text ever since
            the 1500s, when an unknown printer took a galley of type and
            scrambled it to make a type specimen book.
          </p>
          <div className="flex items-center gap-2 mt-5">
            <img
              src={assets.googlePlay}
              alt="google play"
              className="h-9 w-auto opacity-80 hover:opacity-100 transition"
            />
            <img
              src={assets.appStore}
              alt="app store"
              className="h-9 w-auto opacity-80 hover:opacity-100 transition"
            />
          </div>
        </div>
        <div className="flex-1 flex items-start md:justify-end gap-20 md:gap-40">
          <div>
            <h2 className="font-semibold mb-5 text-white tracking-wide text-sm uppercase">Company</h2>
            <ul className="text-sm space-y-3">
              <li>
                <a href="#" className="hover:text-primary transition-colors">Home</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">About us</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Contact us</a>
              </li>
              <li>
                <a href="#" className="hover:text-primary transition-colors">Privacy policy</a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="font-semibold mb-5 text-white tracking-wide text-sm uppercase">Get in touch</h2>
            <div className="text-sm space-y-3">
              <p>+1-234-567-890</p>
              <p>contact@example.com</p>
            </div>
          </div>
        </div>
      </div>
      <p className="pt-6 text-center text-xs text-gray-500 pb-6 tracking-wide">
        Copyright {new Date().getFullYear()} © MovieTix. All Right Reserved.
      </p>
    </footer>
  );
};

export default Footer;
