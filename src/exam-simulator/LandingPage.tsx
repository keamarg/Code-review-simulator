import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/layout/Layout";

const LandingPage: React.FC = () => {
  useEffect(() => {
    const fadeElements = document.querySelectorAll(".fade-in");
    
    const fadeInOnScroll = () => {
      fadeElements.forEach((el) => {
        const elementTop = el.getBoundingClientRect().top;
        if (elementTop < window.innerHeight - 100) {
          el.classList.add("visible");
        }
      });
    };

    window.addEventListener("scroll", fadeInOnScroll);
    fadeInOnScroll(); // Initial check
    
    return () => window.removeEventListener("scroll", fadeInOnScroll);
  }, []);

  return (
    <Layout>
      <div className="bg-white">
        {/* Hero Section */}
        <section className="relative bg-blue-800 py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="md:w-1/2 md:pr-10">
                <h1 className="text-3xl md:text-5xl font-bold text-white">
                  Eksamenstræning der virker
                </h1>
                <p className="mt-4 text-xl text-blue-100">
                  Træn din mundtlige eksamen med en AI du kan snakke med
                </p>
                <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0">
                  <Link
                    to="/create"
                    className="inline-flex justify-center items-center mb-4 px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                  >
                    Opret eksamenssimulering
                  </Link>
                  <Link
                    to="/hvordan"
                    className="inline-flex justify-center items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-blue-700 focus:outline-none"
                  >
                    Se hvordan det virker
                  </Link>
                </div>
              </div>
              <div className="mt-10 md:mt-0 md:w-1/2">
                <div className="relative mx-auto max-w-md">
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Algoritmer og Datastrukturer</p>
                        <p className="text-sm text-gray-500">10 min</p>
                      </div>
                    </div>
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="ml-3 text-sm text-gray-700">Algoritmer og datastrukturer</p>
                        </div>
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="ml-3 text-sm text-gray-700">Big O</p>
                        </div>
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="ml-3 text-sm text-gray-700">Sorteringsalgoritmer</p>
                        </div>
                      </div>
                    </div>
                    {/* <div className="mt-6">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <p className="text-right text-xs text-gray-500 mt-1">75% gennemført</p>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Fordele sektion */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Træn som til den rigtige eksamen</h2>
              <p className="mt-2 text-lg text-gray-600">Forbered dig optimalt med realistiske eksamensforhold</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              
              <div className="bg-white p-6 rounded-lg shadow-md fade-in">
                <div className="w-12 h-12 rounded-md bg-blue-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-gray-900">Snak som i den rigtige eksamen</h3>
                <p className="mt-2 text-gray-600">Del din skærm og gå til eksamen ved en AI censor der både forstår og udfordrer dig</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md fade-in">
                <div className="w-12 h-12 rounded-md bg-blue-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-gray-900">Tilpasset dit pensum</h3>
                <p className="mt-2 text-gray-600">Din underviser har oprettet en eksamen der minder så meget om den rigtige eksamen som muligt</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md fade-in">
                <div className="w-12 h-12 rounded-md bg-blue-100 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-gray-900">Detaljeret feedback og karakter</h3>
                <p className="mt-2 text-gray-600">Få personlig feedback og en karakter og dermed lær af dine fejl for at forbedre din præstation.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Citat sektion */}
        <section className="py-12 md:py-16 fade-in">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <svg className="h-12 w-12 text-gray-300 mx-auto mb-4" fill="currentColor" viewBox="0 0 32 32">
              <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
            </svg>
            <p className="text-xl md:text-2xl font-medium text-gray-900">
              "Man kan jo bare snakke med AI'en! Det føles virkelig som at tage den rigtige eksamen, men i trygge rammer, hvor ingen dømmer mig"
            </p>
            <div className="mt-6">
              <p className="font-medium text-gray-900">Mette Andersen</p>
              <p className="text-gray-600">Datalogistuderende, Københavns Universitet</p>
            </div>
          </div>
        </section>

        {/* CTA sektion */}
        <section className="py-12 md:py-16 bg-blue-700 fade-in">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Klar til at forbedre din eksamensforberedelse?</h2>
            <p className="mt-4 text-lg text-blue-100 max-w-2xl mx-auto">
              Slut dig til over 10.000 danske studerende der allerede har forbedret deres eksamensresultater.
            </p>
            <div className="mt-8">
              <Link
                to="/create"
                className="inline-flex justify-center items-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-blue-50 focus:outline-none"
              >
                Kom i gang nu
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* CSS for animations */}
      <style>
        {`
          .fade-in {
            opacity: 0;
            transform: translateY(20px);
            transition: opacity 0.6s ease, transform 0.6s ease;
          }
          
          .fade-in.visible {
            opacity: 1;
            transform: translateY(0);
          }
        `}
      </style>
    </Layout>
  );
};

export default LandingPage;
