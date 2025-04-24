import React, { useEffect, useRef, useState, memo, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from "react-router-dom";
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import image1 from "/image1.png";
import image2 from "/image2.png";
import clsx from "clsx";


gsap.registerPlugin(ScrollTrigger);


export const PageLayout = ({ children }) => {
  return (
    <div className="relative bg-gradient-to-br from-gray-900 via-black to-blue-950 text-white overflow-x-hidden">
      {/* Abstract background elements */}
      <div className="fixed inset-0 bg-[url('/images/grid-pattern.svg')] opacity-10 pointer-events-none"></div>
      
      {/* Dynamic floating shapes - asymmetrical positioning */}
      <div className="fixed top-0 left-10 w-1/4 h-1/3 bg-blue-500/10 filter blur-3xl rounded-full pointer-events-none transform -rotate-12"></div>
      <div className="fixed bottom-0 right-20 w-1/3 h-1/3 bg-purple-500/10 filter blur-3xl rounded-full pointer-events-none transform rotate-6"></div>
      <div className="fixed top-1/3 left-1/4 w-1/5 h-1/5 bg-indigo-500/5 filter blur-3xl rounded-full pointer-events-none"></div>
      <div className="fixed bottom-1/4 left-10 w-1/6 h-1/6 bg-cyan-500/5 filter blur-3xl rounded-full pointer-events-none"></div>
     
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Modern Contact Component with asymmetrical grid and layered elements
export const Contact = memo(() => {
  const { t } = useTranslation();
  const contactRef = useRef(null);
  const headingRef = useRef(null);
  const formDataRef = useRef({
    name: '',
    email: '',
    message: ''
  });

  const setupAnimations = useCallback(() => {
    const heading = headingRef.current;
    if (!heading) return;

    const chars = heading.textContent.split('');
    heading.innerHTML = '';
    const fragment = document.createDocumentFragment();
    chars.forEach((char) => {
      const span = document.createElement('span');
      span.textContent = char;
      if (char !== ' ') span.className = 'inline-block';
      fragment.appendChild(span);
    });
    heading.appendChild(fragment);

    const characters = heading.querySelectorAll('span');
    
    gsap.fromTo(
      characters,
      { 
        opacity: 0,
        y: () => gsap.utils.random(-50, 50),
        rotateZ: () => gsap.utils.random(-10, 10),
        willChange: 'transform, opacity'
      },
      {
        opacity: 1,
        y: 0,
        rotateZ: 0,
        duration: 0.8,
        stagger: 0.02,
        ease: 'back.out(1.4)',
        scrollTrigger: {
          trigger: heading,
          start: 'top 85%',
          toggleActions: 'play none none none',
          fastScrollEnd: true
        }
      }
    );

    const contactElements = contactRef.current?.querySelectorAll('.contact-element');
    if (!contactElements?.length) return;

    gsap.fromTo(
      contactElements,
      { 
        opacity: 0, 
        y: 40,
        scale: 0.95,
        willChange: 'transform, opacity'
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.7,
        stagger: 0.2,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: contactRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
          fastScrollEnd: true
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger === heading || trigger.trigger === contactRef.current) {
          trigger.kill();
        }
      });
    };
  }, []);

  useEffect(() => {
    const cleanup = setupAnimations();
    return cleanup;
  }, [setupAnimations]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    formDataRef.current[name] = value;
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    console.log('Form submitted:', formDataRef.current);
    formDataRef.current = { name: '', email: '', message: '' };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen py-24 px-6 overflow-x-hidden">
      <div className="max-w-screen-xl mx-auto relative z-10">
        <h2 ref={headingRef} className="text-6xl md:text-7xl font-bold text-center mb-20 leading-tight tracking-tight">
          {t('contact.title')}
        </h2>
        
        <div ref={contactRef} className="max-w-6xl mx-auto grid md:grid-cols-5 gap-8 md:gap-6 lg:gap-12 overflow-hidden">
          <div className="md:col-span-2 contact-element">
            <div className="relative mb-8">
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-blue-500/20 rounded-full blur-md"></div>
              <h3 className="text-3xl font-bold mb-6 relative">
                <span className="tracking-wide">Get in</span>
                <br />
                <span className="text-4xl text-blue-400 tracking-tight -ml-1 transform rotate-2 inline-block">TOUCH</span>
              </h3>
              <div className="bg-gray-900/40 backdrop-blur-lg p-6 rounded-2xl shadow-2xl border border-blue-900/30 space-y-6">
                <div className="relative overflow-hidden transition-transform duration-300 hover:translate-x-2">
                  <p className="text-gray-300 mb-1 text-sm uppercase tracking-widest">Location</p>
                  <p className="font-medium">{t('contact.contactInfo.address')}</p>
                </div>
                <div className="relative overflow-hidden transition-transform duration-300 hover:translate-x-2">
                  <p className="text-gray-300 mb-1 text-sm uppercase tracking-widest">Phone</p>
                  <p className="font-medium">{t('contact.contactInfo.phone')}</p>
                </div>
                <div className="relative overflow-hidden transition-transform duration-300 hover:translate-x-2">
                  <p className="text-gray-300 mb-1 text-sm uppercase tracking-widest">Email</p>
                  <p className="font-medium">{t('contact.contactInfo.email')}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/40 backdrop-blur-lg p-6 rounded-2xl shadow-2xl border border-blue-900/30 relative overflow-hidden">
              <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
              <h4 className="text-xl font-semibold mb-4 relative">
                <span className="inline-block border-b-2 border-blue-400 pb-1">Hours</span>
              </h4>
              <p className="text-gray-300">{t('contact.businessHours.weekdays')}</p>
              <p className="text-gray-300">{t('contact.businessHours.saturday')}</p>
              <p className="text-gray-300">{t('contact.businessHours.sunday')}</p>
            </div>
          </div>
          
          <div className="md:col-span-3 contact-element relative">
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-purple-500/20 rounded-full blur-lg"></div>
            <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-blue-500/30 rounded-full blur-lg"></div>
            
            <div className="bg-gray-900/60 backdrop-blur-lg p-8 md:p-10 rounded-2xl shadow-2xl border border-blue-900/30 relative z-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label className="block mb-2 text-gray-300 text-sm uppercase tracking-wider">
                    {t('contact.form.nameLabel')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formDataRef.current.name}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-xl bg-gray-800/50 text-white border border-blue-900/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-gray-300 text-sm uppercase tracking-wider">
                    {t('contact.form.emailLabel')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formDataRef.current.email}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-xl bg-gray-800/50 text-white border border-blue-900/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-2 text-gray-300 text-sm uppercase tracking-wider">
                    {t('contact.form.messageLabel')}
                  </label>
                  <textarea
                    name="message"
                    value={formDataRef.current.message}
                    onChange={handleChange}
                    className="w-full px-5 py-4 rounded-xl bg-gray-800/50 text-white border border-blue-900/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                    rows="10"
                    required
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    className="group relative overflow-hidden px-10 py-4 bg-gradient-to-r from-blue-600/80 to-blue-500/60 backdrop-blur-lg text-white rounded-l-full rounded-r-lg shadow-lg hover:shadow-blue-500/20 transition-colors duration-300"
                  >
                    <span className="relative z-10 font-medium tracking-wider">
                      {t('contact.form.submitButton')}
                    </span>
                    <span className="absolute bottom-0 right-0 w-10 h-10 bg-blue-400/30 rounded-full transform scale-0 group-hover:scale-150 transition-transform duration-300"></span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const ServiceCard = React.memo(
  ({ service, index, activeIndex, handleCardHover, handleCardLeave, addToContentRefs, t }) => (
    <div
      ref={addToContentRefs}
      className="bg-gray-900/40 backdrop-blur-md rounded-2xl p-6 border border-blue-900/30 shadow-xl hover:shadow-blue-500/10 transition-all duration-300 h-full relative transform-gpu"
      onMouseEnter={() => handleCardHover(index)}
      onMouseLeave={handleCardLeave}
    >
      <div
        className={clsx(
          "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500/70 to-transparent transform transition-transform duration-700",
          activeIndex === index ? "scale-x-100" : "scale-x-0"
        )}
      />
      <div className="flex justify-center mb-6">
        <div
          className={clsx(
            "relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center bg-gray-800/80 shadow-lg transition-all duration-500",
            activeIndex === index && "transform rotate-6 shadow-blue-500/20"
          )}
        >
          <i className={clsx(service.icon, "text-3xl md:text-4xl text-blue-400")} />
          {activeIndex === index && (
            <div className="absolute inset-0 bg-blue-500/10 rounded-2xl animate-pulse" />
          )}
        </div>
      </div>
      <h3 className="text-xl font-bold mb-4 text-center">{service.title}</h3>
      <p className="text-gray-300 text-center">{service.description}</p>
    </div>
  )
);

export const ProductsAndServices = React.memo(() => {
  const { t } = useTranslation();
  const timelineRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRefs = useRef([]);
  const cardsContentRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(null);

  // Stable ref callbacks
  const addToCardRefs = useCallback((el) => {
    if (el && !cardsRefs.current.includes(el)) {
      cardsRefs.current.push(el);
    }
  }, []);

  const addToContentRefs = useCallback((el) => {
    if (el && !cardsContentRefs.current.includes(el)) {
      cardsContentRefs.current.push(el);
    }
  }, []);

  // Memoized services data
  const services = useMemo(
    () => t("productsAndServices.services", { returnObjects: true }),
    [t]
  );

  // Stable event handlers
  const handleCardHover = useCallback((index) => setActiveIndex(index), []);
  const handleCardLeave = useCallback(() => setActiveIndex(null), []);

  // GSAP animations with IntersectionObserver
  useEffect(() => {
    if (!gsap || !ScrollTrigger || !timelineRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          gsap.registerPlugin(ScrollTrigger);
          const ctx = gsap.context(() => {
            // Title animation
            gsap.fromTo(
              titleRef.current,
              { opacity: 0, y: 30 },
              {
                opacity: 1,
                y: 0,
                duration: 0.8,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: titleRef.current,
                  start: "top 80%",
                  once: true,
                },
              }
            );

            // Cards animation
            gsap.fromTo(
              cardsRefs.current,
              { opacity: 0, y: 50, scale: 0.95 },
              {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.8,
                ease: "back.out(1.2)",
                stagger: 0.2,
                scrollTrigger: {
                  trigger: timelineRef.current,
                  start: "top 75%",
                  once: true,
                },
              }
            );
          }, timelineRef.current);

          const refreshTimeout = setTimeout(() => {
            ScrollTrigger.refresh();
          }, 100);

          return () => {
            clearTimeout(refreshTimeout);
            ctx.revert();
          };
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(timelineRef.current);

    return () => observer.disconnect();
  }, [services]);

  // Error boundary for invalid services
  if (!services || !Array.isArray(services) || services.length === 0) {
    return (
      <div className="min-h-screen bg-black-900 text-white py-16 text-center">
        <p>{t("productsAndServices.error") || "No services available."}</p>
      </div>
    );
  }

  return (
    <div
      ref={timelineRef}
      className="min-h-screen bg-black-900 text-white py-16 relative overflow-hidden"
    >
      {/* Optimized background particles */}
      <div className="absolute top-20 left-10 w-24 h-24 bg-blue-500/10 rounded-full blur-xl will-change-transform" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-purple-500/10 rounded-full blur-xl will-change-transform" />
      <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 will-change-transform" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section header */}
        <div ref={titleRef} className="max-w-4xl mx-auto mb-16 space-y-6">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center leading-tight">
            <span className="block">{t("productsAndServices.title.part1")}</span>
            <span className="text-blue-400 block mt-2">
              {t("productsAndServices.title.highlight")}
            </span>
            <span className="block">{t("productsAndServices.title.part2")}</span>
          </h2>
          <p className="text-center text-gray-300 max-w-2xl mx-auto">
            {t("productsAndServices.subtitle")}
          </p>
        </div>

        {/* Timeline with vertical line */}
        <div className="relative">
          {/* Vertical timeline line - desktop only */}
          <div className="hidden md:block absolute left-1/2 top-10 bottom-10 w-1 bg-gradient-to-b from-blue-500/20 via-purple-500/30 to-blue-400/20 transform -translate-x-1/2" />

          {/* Cards container */}
          <div className="space-y-24 md:space-y-32 relative">
            {services.map((service, index) => (
              <div
                key={`service-${index}`}
                ref={addToCardRefs}
                className={clsx(
                  "relative flex flex-col md:flex-row",
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                )}
              >
                {/* Year marker for desktop */}
                <div className="hidden md:flex absolute left-1/2 top-0 -translate-x-1/2 z-10">
                  <div className="w-12 h-12 rounded-full bg-gray-800 border-4 border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <div
                      className={clsx(
                        "w-4 h-4 rounded-full transition-colors duration-300",
                        activeIndex === index ? "bg-blue-400 animate-pulse" : "bg-blue-500/50"
                      )}
                    />
                  </div>
                </div>

                {/* Card */}
                <div
                  className={clsx(
                    "w-full md:w-5/12",
                    index % 2 === 0 ? "md:pr-8" : "md:pl-8"
                  )}
                >
                  <ServiceCard
                    service={service}
                    index={index}
                    activeIndex={activeIndex}
                    handleCardHover={handleCardHover}
                    handleCardLeave={handleCardLeave}
                    addToContentRefs={addToContentRefs}
                    t={t}
                  />
                </div>

                {/* Empty space for alignment */}
                <div className="hidden md:block w-5/12" />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile indicator */}
        <div className="flex justify-center mt-12 md:hidden">
          <div className="px-4 py-2 bg-gray-800/60 backdrop-blur-sm rounded-full text-sm text-gray-400">
            {t("productsAndServices.mobileIndicator")}
          </div>
        </div>
      </div>
    </div>
  );
});

// Solutions Component with layered content and asymmetrical design
export const Solutions = React.memo(() => {
  const { t } = useTranslation();
  const solutionsRef = useRef(null);
  const headingRef = useRef(null);

  const solutions = useMemo(() => t('solutions.solutions', { returnObjects: true }), [t]);
  const solutionImages = useMemo(() => [image1, image2], []);

  useEffect(() => {
    let isMounted = true;

    const loadGSAP = async () => {
      try {
        const { gsap } = await import('gsap');
        const { ScrollTrigger } = await import('gsap/ScrollTrigger');
        gsap.registerPlugin(ScrollTrigger);

        if (!isMounted) return;

        gsap.set(solutionsRef.current, { willChange: 'transform, opacity' });
        gsap.set(headingRef.current, { willChange: 'transform, opacity' });

        const headingElements = headingRef.current?.querySelectorAll('.heading-part');
        gsap.set(headingElements, { opacity: 0, y: 20 });

        ScrollTrigger.create({
          trigger: headingRef.current,
          start: 'top 80%',
          onEnter: () => {
            gsap.to(headingElements, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.15,
              ease: 'power3.out',
            });
          },
        });

        const solutionItems = solutionsRef.current?.querySelectorAll('.solution-item');
        solutionItems.forEach((item, index) => {
          const isEven = index % 2 === 0;
          const textContent = item.querySelector('.md\\:w-2\\/5 > div');
        
          gsap.set(textContent, {
            opacity: 0,
            x: isEven ? -30 : 30,
            willChange: 'transform, opacity',
          });
        
          gsap.to(textContent, {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 70%',
              toggleActions: 'play none none reverse',
            },
          });

          const decorativeElements = item.querySelectorAll('.absolute');
          if (decorativeElements.length) {
            gsap.to(decorativeElements, {
              y: () => gsap.utils.random(-8, 8),
              duration: 4,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
            });
          }
        });
      } catch (error) {
        console.error('Failed to load GSAP:', error);
      }
    };

    loadGSAP();

    return () => {
      isMounted = false;
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      gsap.killTweensOf('*');
    };
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen py-16 overflow-x-hidden">
      <div className="max-w-screen-xl mx-auto px-4 relative z-10">
        <div ref={headingRef} className="relative mb-16 text-center">
          <div className="heading-part">
            <span className="text-lg md:text-xl uppercase tracking-widest text-gray-400">
              {t('solutions.heading.subtitle')}
            </span>
          </div>
          <h2 className="heading-part text-4xl md:text-6xl font-bold mt-2 mb-4">
            <span className="relative inline-block">
              <span className="absolute -top-1 -left-1 text-blue-500/20 blur-sm">
                {t('solutions.heading.title_part1')}
              </span>
              <span className="relative">{t('solutions.heading.title_part1')}</span>
            </span>{' '}
            <span className="text-blue-400">{t('solutions.heading.title_part2')}</span>
          </h2>
          <p className="heading-part max-w-xl mx-auto text-gray-300 text-base md:text-lg">
            {t('solutions.heading.description')}
          </p>
          <div className="absolute top-1/2 left-1/4 w-4 h-4 bg-blue-500/30 rounded-full blur-sm transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-1/3 w-3 h-3 bg-purple-500/50 rounded-full blur-sm" />
        </div>

        <div ref={solutionsRef} className="relative">
          {solutions.map((solution, index) => (
            <div key={index} className="solution-item relative mb-24 md:mb-32">
              <div className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-stretch`}>
                <div className="md:w-2/5 flex flex-col justify-center relative z-10">
                  <div className="absolute -top-8 -left-8 w-16 h-16 bg-blue-500/10 rounded-full blur-lg" />
                  <div
                    className={`bg-gray-900/50 backdrop-blur-lg p-6 md:p-8 rounded-xl shadow-xl border border-blue-900/30 transform ${
                      index % 2 === 0 ? 'md:-translate-x-8' : 'md:translate-x-8'
                    }`}
                  >
                    <h3 className="text-2xl font-bold mb-4">
                      {solution.title.split(' ').map((word, idx) =>
                        idx === 0 ? (
                          <span key={idx} className="text-blue-400 block text-3xl mb-1">
                            {word}
                          </span>
                        ) : (
                          <span key={idx}>{word} </span>
                        )
                      )}
                    </h3>
                    <p className="text-gray-300 mb-6 leading-relaxed">{solution.description}</p>
                    <NavLink
                      to={index === 0 ? "/maps" : "/dashboard"}
                      className="group relative overflow-hidden px-6 py-2 bg-transparent border border-blue-500/40 text-blue-400 rounded-l-lg rounded-r-sm transition-colors hover:bg-blue-500/10"
                    >
                      <span className="relative z-10 group-hover:tracking-wider transition-all duration-200">
                        {solution.buttonText}
                      </span>
                      <span className="absolute bottom-0 left-0 w-0 h-1 bg-blue-500/40 group-hover:w-full transition-all duration-300" />
                    </NavLink>
                  </div>
                </div>

                <div className={`md:w-3/5 relative mt-6 md:mt-0 overflow-hidden`}>
                  <div className="relative">
                    <div className={`relative z-10 transform md:translate-y-4 ${index % 2 === 0 ? 'md:translate-x-8' : 'md:-translate-x-8'}`}>
                      <div className="p-1 rounded-xl overflow-hidden">
                        <img
                          src={solutionImages[index]}
                          alt={solution.title}
                          className="rounded-lg w-full h-[300px] object-cover"
                          loading="lazy"
                        />
                      </div>
                    </div>
                    <div
                      className={`absolute ${index % 2 === 0 ? 'bottom-8 -right-8' : 'top-8 -left-8'} w-32 h-32 bg-blue-500/5 rounded-full blur-xl z-0`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// FAQ Component with unique accordion design
export const FAQ = React.memo(() => {
  const { t } = useTranslation();
  const faqRef = useRef(null);
  const headingRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = useCallback((index) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  }, []);

  const faqs = t('faq.questions', { returnObjects: true });

  return (
    <div className="flex items-center justify-center min-h-screen py-24 overflow-x-hidden">
      <div className="max-w-screen-xl mx-auto px-6 relative z-10">
        <div ref={headingRef} className="relative mb-20">
          <h2 className="text-center">
            <span className="block text-lg text-gray-400 uppercase tracking-wider mb-2">
              {t('faq.heading.subtitle')}
            </span>
            <span className="text-5xl md:text-6xl font-bold block mb-8 relative">
              <span className="relative z-10">{t('faq.heading.title_part1')}</span>
              <span className="block text-blue-400 mt-1">{t('faq.heading.title_part2')}</span>
            </span>
          </h2>
          <p className="text-center text-gray-300 max-w-2xl mx-auto">
            {t('faq.heading.description')}
          </p>
          <div className="absolute top-1/3 left-1/4 w-8 h-8 bg-blue-500/30 rounded-full blur-lg"></div>
          <div className="absolute bottom-0 right-1/4 w-6 h-6 bg-purple-500/20 rounded-full blur-lg"></div>
        </div>

        <div ref={faqRef} className="max-w-4xl mx-auto relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {faqs.map((faq, index) => (
            <div
              key={faq.id || index}
              className={`faq-item mb-6 relative overflow-hidden transition-shadow duration-300 ${
                activeIndex === index ? 'shadow-lg shadow-blue-500/5' : ''
              }`}
            >
              <button
                className={`w-full text-left p-6 md:p-8 rounded-2xl flex justify-between items-center ${
                  activeIndex === index
                    ? 'bg-gray-900/70 border border-blue-900/40'
                    : 'bg-gray-900/40 border border-gray-800/40 hover:bg-gray-900/50'
                } transition-colors duration-300`}
                onClick={() => toggleFAQ(index)}
              >
                <span className="font-semibold text-xl mr-6">{faq.question}</span>
                <span className={`transform transition-transform duration-300 ${activeIndex === index ? 'rotate-45' : ''}`}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    className={`${activeIndex === index ? 'text-blue-400' : 'text-gray-400'}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </span>
              </button>

              <div
                className={`overflow-hidden transition-[max-height,opacity] duration-500 ease-in-out bg-gray-900/30 border-l border-r border-b border-blue-900/20 rounded-b-2xl ${
                  activeIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="p-6 md:p-8 text-gray-300 leading-relaxed">{faq.answer}</div>
              </div>

              <div
                className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-500/50 to-purple-500/50 transition-[width,opacity] duration-700 ${
                  activeIndex === index ? 'w-full opacity-100' : 'w-0 opacity-0'
                }`}
              ></div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-gray-300 mb-6">{t('faq.cta.text')}</p>
          <a
            href="#contact"
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600/70 to-blue-500/50 text-white rounded-xl shadow-lg hover:shadow-blue-500/20 transition-shadow duration-300"
          >
            <span className="mr-2">{t('faq.cta.button')}</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
});