import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

// Contact Component
export const Contact = () => {
  const { t } = useTranslation();
  const contactRef = useRef(null);

  useEffect(() => {
    const contactElements = contactRef.current.querySelectorAll('.contact-element');
    
    gsap.fromTo(contactElements, 
      { 
        opacity: 0, 
        y: 50 
      },
      {
        opacity: 1, 
        y: 0,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
          trigger: contactRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add form submission logic
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black text-white overflow-hidden py-20">
      <div className="container mx-auto px-6 relative z-10">
        <h2 className="text-5xl font-bold text-center mb-16">
          {t('contact.title', { 
            defaultValue: 'Contact Us' 
          }).split(' ').map((word, index) => 
            index === 1 ? 
            <span key={index} className="text-blue-400">{word} </span> : 
            word + ' '
          )}
        </h2>
        <div ref={contactRef} className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">
          <div className="contact-element bg-gray-900/60 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-blue-900/30">
            <h3 className="text-2xl font-semibold mb-6">Get in Touch</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 text-gray-300">
                  {t('contact.form.nameLabel')}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800/50 backdrop-blur-lg text-white border border-blue-900/30 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-300">
                  {t('contact.form.emailLabel')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800/50 backdrop-blur-lg text-white border border-blue-900/30 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-gray-300">
                  {t('contact.form.messageLabel')}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-800/50 backdrop-blur-lg text-white border border-blue-900/30 focus:ring-2 focus:ring-blue-500"
                  rows="5"
                  required
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="w-full bg-blue-500/50 backdrop-blur-lg text-white py-3 rounded-full hover:bg-blue-500/70 transition-colors"
              >
                {t('contact.form.submitButton')}
              </button>
            </form>
          </div>
          <div className="contact-element flex flex-col justify-center space-y-6">
            <div className="bg-gray-900/60 backdrop-blur-lg p-6 rounded-2xl shadow-2xl border border-blue-900/30">
              <h4 className="text-xl font-semibold mb-4">Contact Information</h4>
              <p className="text-gray-300 mb-2">
                <i className="fas fa-map-marker-alt mr-3 text-blue-400"></i>
                {t('contact.contactInfo.address')}
              </p>
              <p className="text-gray-300 mb-2">
                <i className="fas fa-phone mr-3 text-blue-400"></i>
                {t('contact.contactInfo.phone')}
              </p>
              <p className="text-gray-300">
                <i className="fas fa-envelope mr-3 text-blue-400"></i>
                {t('contact.contactInfo.email')}
              </p>
            </div>
            <div className="bg-gray-900/60 backdrop-blur-lg p-6 rounded-2xl shadow-2xl border border-blue-900/30">
              <h4 className="text-xl font-semibold mb-4">
                {t('contact.businessHours.title')}
              </h4>
              <p className="text-gray-300">{t('contact.businessHours.weekdays')}</p>
              <p className="text-gray-300">{t('contact.businessHours.saturday')}</p>
              <p className="text-gray-300">{t('contact.businessHours.sunday')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Products & Services Component
export const ProductsAndServices = () => {
  const { t } = useTranslation();
  const servicesRef = useRef(null);

  useEffect(() => {
    const services = servicesRef.current.querySelectorAll('.service-item');
    
    gsap.fromTo(services, 
      { 
        opacity: 0, 
        y: 50, 
        scale: 0.9 
      },
      {
        opacity: 1, 
        y: 0, 
        scale: 1,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: {
          trigger: servicesRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, []);

  const services = t('productsAndServices.services', { returnObjects: true });

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black text-white overflow-hidden py-20">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"></div>
      <div className="container mx-auto px-6 relative z-10">
        <h2 className="text-5xl font-bold text-center mb-16">
          {t('productsAndServices.title', { 
            defaultValue: 'Our Products & Services' 
          }).split(' ').map((word, index) => 
            index === 1 ? 
            <span key={index} className="text-blue-400">{word} </span> : 
            word + ' '
          )}
        </h2>
        <div ref={servicesRef} className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="service-item opacity-0 bg-gray-900/60 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-blue-900/30 hover:border-blue-500/50 transition-all duration-300 transform hover:-translate-y-4"
            >
              <div className="text-center">
                <i className={`${service.icon} text-6xl text-blue-400 mb-6 inline-block`}></i>
                <h3 className="text-2xl font-semibold mb-4">{service.title}</h3>
                <p className="text-gray-300">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Solutions Component
export const Solutions = () => {
  const { t } = useTranslation();
  const solutionsRef = useRef(null);

  useEffect(() => {
    const solutions = solutionsRef.current.querySelectorAll('.solution-item');
    
    solutions.forEach((solution, index) => {
      gsap.fromTo(solution, 
        { 
          opacity: 0, 
          x: index % 2 === 0 ? -100 : 100 
        },
        {
          opacity: 1, 
          x: 0,
          duration: 0.8,
          scrollTrigger: {
            trigger: solution,
            start: 'top 70%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    });
  }, []);

  const solutions = t('solutions.solutions', { returnObjects: true });

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black text-white overflow-hidden py-20">
      <div className="container mx-auto px-6 relative z-10">
        <h2 className="text-5xl font-bold text-center mb-16">
          {t('solutions.title', { 
            defaultValue: 'Innovative Solutions' 
          }).split(' ').map((word, index) => 
            index === 1 ? 
            <span key={index} className="text-blue-400">{word} </span> : 
            word + ' '
          )}
        </h2>
        <div ref={solutionsRef}>
          {solutions.map((solution, index) => (
            <div 
              key={index} 
              className={`solution-item flex flex-col md:flex-row items-center mb-16 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
            >
              <div className="md:w-1/2 p-6">
                <h3 className="text-3xl font-semibold mb-4">{solution.title}</h3>
                <p className="text-gray-300 mb-6">{solution.description}</p>
                <button className="bg-blue-500/50 backdrop-blur-lg text-white px-8 py-4 rounded-full hover:bg-blue-500/70 transition-colors">
                  {solution.buttonText}
                </button>
              </div>
              <div className="md:w-1/2 p-6">
                <img 
                  src={`/images/dashboard-${index + 1}.png`} 
                  alt={solution.title} 
                  className="rounded-2xl shadow-2xl w-full border border-blue-900/30"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// FAQ Component
export const FAQ = () => {
  const { t } = useTranslation();
  const faqRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const faqItems = faqRef.current.querySelectorAll('.faq-item');
    
    gsap.fromTo(faqItems, 
      { 
        opacity: 0, 
        y: 50 
      },
      {
        opacity: 1, 
        y: 0,
        duration: 0.6,
        stagger: 0.2,
        scrollTrigger: {
          trigger: faqRef.current,
          start: 'top 70%',
          toggleActions: 'play none none reverse'
        }
      }
    );
  }, []);

  const faqs = t('faq.questions', { returnObjects: true });

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-black text-white overflow-hidden py-20">
      <div className="container mx-auto px-6 relative z-10">
        <h2 className="text-5xl font-bold text-center mb-16">
          {t('faq.title', { 
            defaultValue: 'Frequently Asked Questions' 
          }).split(' ').map((word, index) => 
            index === 2 ? 
            <span key={index} className="text-blue-400">{word} </span> : 
            word + ' '
          )}
        </h2>
        <div ref={faqRef} className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="faq-item bg-gray-900/60 backdrop-blur-lg rounded-2xl shadow-2xl border border-blue-900/30 overflow-hidden"
            >
              <button 
                onClick={() => toggleFAQ(index)}
                className="w-full text-left p-6 flex justify-between items-center hover:bg-gray-800/50 transition-colors"
              >
                <span className="text-lg font-semibold">{faq.question}</span>
                <i 
                  className={`fas ${activeIndex === index ? 'fa-chevron-up' : 'fa-chevron-down'} text-blue-400`}
                ></i>
              </button>
              {activeIndex === index && (
                <div className="p-6 pt-0 text-gray-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};