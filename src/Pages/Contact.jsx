import React, { useState, useEffect } from "react";
import { IoIosArrowForward } from "react-icons/io";
import { Link } from "react-router-dom";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import AOS from "aos";
import "aos/dist/aos.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import Head from "../Components/Head";

const contactInfo = [
  {
    icon: <FaPhoneAlt className="text-xl md:text-3xl text-primary mb-4" />,
    title: "Phone",
    description: "A wonderful serenity has taken possession of my entire soul, like these.",
    link: "tel:+123452345",
    linkText: "+91 344 543 6789",
  },
  {
    icon: <FaEnvelope className="text-xl md:text-3xl text-primary mb-4" />,
    title: "Email",
    description: "A wonderful serenity has taken possession of my entire soul, like these.",
    link: "mailto:mauvalprint@gmail.com",
    linkText: "mauvalprint@gmail.com",
  },
  {
    icon: <FaMapMarkerAlt className="text-xl md:text-3xl text-primary mb-4" />,
    title: "Location",
    description: `4 apt. Flawing Street. The Grand Avenue. Liverpool, UK 33342`,
    link: "https://maps.google.com",
    linkText: "View On Google Map",
  },
];

const sliderImages = [
  "/Image/c3.png",
  "/Image/c1.png",
 
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    emailid: "",
    phoneno: "",
    address: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.emailid.trim()) {
      newErrors.emailid = "Email is required.";
    } else if (!/\S+@\S+\.\S+/.test(formData.emailid)) {
      newErrors.emailid = "Invalid email format.";
    }
    if (!formData.phoneno.trim()) {
      newErrors.phoneno = "Mobile number is required.";
    } else if (!/^\d{10}$/.test(formData.phoneno)) {
      newErrors.phoneno = "Enter a valid 10-digit mobile number.";
    }
    if (!formData.address.trim()) newErrors.address = "Address is required.";
    if (!formData.message.trim()) newErrors.message = "Message is required.";
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validate();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
    } else {
      setIsSending(true);
      setResult("");

      const web3FormData = new FormData();
      web3FormData.append("access_key", "b486824e-4e1e-4c87-b9c0-faf72c5a24ca");
      web3FormData.append("name", formData.name);
      web3FormData.append("email", formData.emailid);
      web3FormData.append("message", formData.message);
      web3FormData.append("cf_phone", formData.phoneno);
      web3FormData.append("cf_address", formData.address);

      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          body: web3FormData,
        });

        const data = await res.json();

        if (data.success) {
          setResult("✅ Message sent successfully!");
          setFormData({
            name: "",
            emailid: "",
            phoneno: "",
            address: "",
            message: "",
          });
        } else {
          setResult("❌ Failed to send. Try again.");
        }
      } catch (err) {
        console.error("Web3Forms Error:", err);
        setResult("⚠️ Something went wrong.");
      } finally {
        setIsSending(false);
      }
    }
  };

  const sliderSettings = {
    // dots: true,
    infinite: true,
    speed: 1500,
    fade: true,
    autoplay: true,
    autoplaySpeed: 2000,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  };

  return (
    <section className="mt-17">
      <Head title="Contact Us" subtitle="Contact Us" />

      <div className="overflow-x-hidden overflow-y-hidden w-full">
        {/* Contact Cards */}
        <section className="py-16 px-6 md:px-4 max-w-screen bg-[#e5e8f0]">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            {contactInfo.map((item, index) => (
              <div
                key={index}
                className="flex flex-col rounded shadow-lg bg-white p-3"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <span className="flex gap-3 items-center">
                  {item.icon}
                  <h3 className="text-xl md:text-2xl font-bold text-primary mb-3">
                    {item.title}
                  </h3>
                </span>
                <a
                  href={item.link}
                  target={item.title === "Location" ? "_blank" : "_self"}
                  rel={item.title === "Location" ? "noopener noreferrer" : ""}
                  className="text-secondary"
                >
                  {item.linkText}
                </a>
              </div>
            ))}
          </div>
        </section>

      {/* Contact Form Section */}
<section className="flex flex-col md:flex-row w-full min-h-screen bg-primary/10 items-center px-6 py-10  gap-0 md:gap-6 overflow-hidden" data-aos="fade-up">
  {/* Slick Slider Image */}
  <div className="w-full md:w-1/2 p-4 md:p-8 flex items-center justify-center" data-aos="fade-right">
    <Slider {...sliderSettings} className="rounded-xl  w-full ">
      {sliderImages.map((src, index) => (
        <div key={index} className="w-full  h-[300px] md:h-[460px]">
          <img
            src={src}
            alt={`Slide ${index + 1}`}
            className="w-full  h-full object-contain bg-[#e5e8f0] p-6 rounded-xl"
          />
        </div>
      ))}
    </Slider>
  </div>

  {/* Contact Form */}
  <div className="w-full md:w-1/2 flex items-center justify-center">
    <div className="w-full max-w-xl bg-[#e5e8f0] p-6 md:p-8 rounded-2xl shadow-lg">
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6 md:mb-8 text-center md:text-left">
        Get in <span className="text-primary">Touch</span>
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {["name", "emailid", "phoneno", "address"].map((field) => (
          <div key={field} className="flex flex-col">
            <input
              type={field === "emailid" ? "email" : field === "phoneno" ? "tel" : "text"}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              placeholder={`Enter your ${field === "emailid" ? "email" : field}`}
              className={`border-b px-4 py-2 text-sm md:text-base focus:outline-none transition duration-200 ${
                errors[field] ? "border-red-500" : "border-black focus:border-primary"
              }`}
            />
            {errors[field] && (
              <span className="text-xs text-red-500 mt-1 pl-2">{errors[field]}</span>
            )}
          </div>
        ))}

        <div className="flex flex-col md:col-span-2">
          <textarea
            name="message"
            rows="4"
            value={formData.message}
            onChange={handleChange}
            placeholder="Write your message..."
            className={`border-b px-4 py-2 text-sm md:text-base focus:outline-none transition duration-200 ${
              errors.message ? "border-red-500" : "border-black focus:border-primary"
            }`}
          ></textarea>
          {errors.message && (
            <span className="text-xs text-red-500 mt-1 pl-2">{errors.message}</span>
          )}
        </div>

        <div className="md:col-span-2 flex flex-col items-center mt-2 md:mt-4">
          <button
            type="submit"
            className="bg-primary text-white  px-6 py-2 md:py-3 rounded-lg hover:bg-opacity-90 transition disabled:opacity-50 w-full md:w-auto"
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send Message"}
          </button>
          {result && (
            <span
              className={`text-sm mt-2 text-center ${
                result.includes("✅") ? "text-green-600" : "text-red-500"
              }`}
            >
              {result}
            </span>
          )}
        </div>
      </form>
    </div>
  </div>
</section>


        {/* Embedded Map */}
        <section className="w-full h-[400px] bg-primary/5 overflow-y-hidden" data-aos="fade-up">
          <iframe
            title="Google Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2381.693499372739!2d-2.9665881842005565!3d53.40837127999433!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x487b212d3fc0b587%3A0x6a0e31c8c2dd34f!2sLiverpool!5e0!3m2!1sen!2suk!4v1686543212345!5m2!1sen!2suk"
            className="w-full h-full border-0 p-4 md:p-10"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </section>
      </div>
    </section>
  );
};

export default Contact;