'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  ShoppingBag,
  Percent,
  Tag,
  Sparkles,
  Truck,
  Clock,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
} from 'lucide-react';

// Default banners if none configured or while loading
export const DEFAULT_HERO_BANNERS = [
  {
    id: 'banner-zepto-1',
    type: 'zepto_style',
    active: true,
    title: 'ALL NEW JYOTHI MART EXPERIENCE',
    subtitle: '',
    card1Text: '₹0 FEES',
    card1Icon: 'bag',
    card2Text: 'EVERYDAY LOW PRICES*',
    card2Icon: 'price_down',
    features: ['₹0 Handling Fee', '₹0 Delivery Fee*', '₹0 Rain & Surge Fee'],
    termsText: '*T&C Apply. Above specific minimum order value',
    badgeText: 'Zero Extra Charges',
    bgTheme: 'purple',
    imageUrl: '',
    linkUrl: '',
  },
  {
    id: 'banner-green-2',
    type: 'custom_promo',
    active: true,
    title: 'SUPERFAST 10-MINUTE GROCERY DELIVERY',
    subtitle: 'Fresh dals, grains, flours & oils delivered directly from our store in minutes',
    card1Text: 'WHOLESALE RATES',
    card1Icon: 'tag',
    card2Text: '100% PURE & FRESH',
    card2Icon: 'sparkles',
    features: ['Direct Mandi Pricing', 'Zero Adulteration', 'Instant Dispatch'],
    termsText: '*Over 1,500 daily essentials available at lowest prices',
    badgeText: 'Instant Quick Delivery',
    bgTheme: 'green',
    imageUrl: '',
    linkUrl: '',
  },
  {
    id: 'banner-orange-3',
    type: 'custom_promo',
    active: true,
    title: 'DAILY SAVINGS FESTIVAL',
    subtitle: 'Big discounts on monthly kitchen rations & bulk grocery packs',
    card1Text: 'UP TO 30% OFF',
    card1Icon: 'percent',
    card2Text: 'FREE DELIVERY*',
    card2Icon: 'truck',
    features: ['Daily Kitchen Deals', 'Fresh Stock Arrived', 'No Minimum Order'],
    termsText: '*Special promotional discounts available across all categories',
    badgeText: 'Super Saver',
    bgTheme: 'orange',
    imageUrl: '',
    linkUrl: '',
  },
];

// Helper to render icon for Card 1 & Card 2
function renderCardIcon(iconType, theme = 'purple') {
  if (iconType === 'bag') {
    return (
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center">
        {/* Stylized quick-commerce shopping bag */}
        <div className="w-10 h-11 sm:w-12 sm:h-13 bg-gradient-to-br from-[#8A38F5] via-[#7022D9] to-[#5013A6] rounded-xl shadow-md flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-1 left-2 right-2 h-1.5 border-t-2 border-white/60 rounded-t-md" />
          <span className="text-white font-black text-lg sm:text-xl tracking-tighter drop-shadow-xs">
            J
          </span>
          {/* Subtle reflection shine */}
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-white/20 rounded-full blur-xs" />
        </div>
      </div>
    );
  }

  if (iconType === 'price_down') {
    return (
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 flex items-center justify-center">
        {/* Scalloped badge with down arrow and golden coin */}
        <div className="w-11 h-11 sm:w-13 sm:h-13 bg-gradient-to-br from-[#8A38F5] to-[#5013A6] rounded-2xl rotate-6 shadow-md flex items-center justify-center relative">
          <TrendingDown className="w-6 h-6 sm:w-7 sm:h-7 text-white stroke-[2.5]" />
          {/* Floating gold rupee coin */}
          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 rounded-full border border-yellow-100 shadow-xs flex items-center justify-center text-[10px] sm:text-xs font-black text-amber-950">
            ₹
          </div>
        </div>
      </div>
    );
  }

  const iconClasses = 'w-6 h-6 sm:w-7 sm:h-7 text-white';
  const bgClasses =
    theme === 'green'
      ? 'from-emerald-500 to-green-700'
      : theme === 'orange'
      ? 'from-amber-500 to-orange-600'
      : theme === 'blue'
      ? 'from-sky-500 to-blue-700'
      : 'from-purple-500 to-purple-800';

  let iconNode = <Sparkles className={iconClasses} />;
  if (iconType === 'percent') iconNode = <Percent className={iconClasses} />;
  else if (iconType === 'tag') iconNode = <Tag className={iconClasses} />;
  else if (iconType === 'truck') iconNode = <Truck className={iconClasses} />;
  else if (iconType === 'clock') iconNode = <Clock className={iconClasses} />;
  else if (iconType === 'shield') iconNode = <ShieldCheck className={iconClasses} />;
  else if (iconType === 'shopping_bag') iconNode = <ShoppingBag className={iconClasses} />;

  return (
    <div
      className={`w-11 h-11 sm:w-13 sm:h-13 bg-gradient-to-br ${bgClasses} rounded-2xl shadow-md flex items-center justify-center flex-shrink-0`}
    >
      {iconNode}
    </div>
  );
}

// Theme color definitions for cards & containers
const THEME_STYLES = {
  purple: {
    container: 'bg-gradient-to-b from-[#F7F3FF] via-[#F1EBFF] to-[#E9DEFF] border-[#E0D0FF]',
    title: 'text-[#581C87]',
    subtitle: 'text-purple-900/80',
    cardBorder: 'border-purple-200/70',
    cardText: 'text-[#4A154B]',
    featureText: 'text-[#3B0764]',
    badgeBg: 'bg-purple-100 text-[#581C87] border-purple-200',
    dotActive: 'bg-[#6B21A8]',
    checkBg: 'bg-[#0C831F]',
  },
  green: {
    container: 'bg-gradient-to-b from-[#F0FDF4] via-[#DCFCE7] to-[#BBF7D0] border-emerald-200',
    title: 'text-[#065F46]',
    subtitle: 'text-emerald-950/80',
    cardBorder: 'border-emerald-200/80',
    cardText: 'text-[#065F46]',
    featureText: 'text-emerald-950',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dotActive: 'bg-[#0C831F]',
    checkBg: 'bg-[#0C831F]',
  },
  orange: {
    container: 'bg-gradient-to-b from-[#FFF7ED] via-[#FFEDD5] to-[#FED7AA] border-orange-200',
    title: 'text-[#9A3412]',
    subtitle: 'text-orange-950/80',
    cardBorder: 'border-orange-200/80',
    cardText: 'text-[#9A3412]',
    featureText: 'text-orange-950',
    badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
    dotActive: 'bg-[#EA580C]',
    checkBg: 'bg-[#0C831F]',
  },
  blue: {
    container: 'bg-gradient-to-b from-[#EFF6FF] via-[#DBEAFE] to-[#BFDBFE] border-blue-200',
    title: 'text-[#1E40AF]',
    subtitle: 'text-blue-950/80',
    cardBorder: 'border-blue-200/80',
    cardText: 'text-[#1E40AF]',
    featureText: 'text-blue-950',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    dotActive: 'bg-[#2563EB]',
    checkBg: 'bg-[#0C831F]',
  },
  dark: {
    container: 'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-950 border-gray-700 text-white',
    title: 'text-white',
    subtitle: 'text-gray-300',
    cardBorder: 'border-gray-700',
    cardText: 'text-gray-900',
    featureText: 'text-gray-200',
    badgeBg: 'bg-gray-800 text-yellow-300 border-gray-700',
    dotActive: 'bg-white',
    checkBg: 'bg-[#0C831F]',
  },
};

export default function HeroBannerCarousel({ banners = [], autoPlayInterval = 5000 }) {
  // Filter active banners or fallback
  const rawList = Array.isArray(banners) && banners.length > 0 ? banners : DEFAULT_HERO_BANNERS;
  const activeBanners = rawList.filter((b) => b.active !== false);
  const slideList = activeBanners.length > 0 ? activeBanners : DEFAULT_HERO_BANNERS;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto-play timer (pauses when user hovers or touches)
  useEffect(() => {
    if (slideList.length <= 1 || isHovered) return;

    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % slideList.length);
    }, autoPlayInterval);

    return () => clearInterval(timer);
  }, [slideList.length, isHovered, autoPlayInterval]);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % slideList.length);
  }, [slideList.length]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + slideList.length) % slideList.length);
  }, [slideList.length]);

  const goToSlide = (idx) => {
    setDirection(idx > currentIndex ? 1 : -1);
    setCurrentIndex(idx);
  };

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }
  };

  const currentBanner = slideList[currentIndex] || slideList[0];
  const theme = THEME_STYLES[currentBanner.bgTheme] || THEME_STYLES.purple;

  // Slide animation variants
  const variants = {
    enter: (dir) => ({
      x: dir > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 },
      },
    },
    exit: (dir) => ({
      x: dir > 0 ? -100 : 100,
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div
      className="relative w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-4 select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative overflow-hidden rounded-3xl shadow-xs border border-gray-100">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentBanner.id || currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className={`w-full ${theme.container} border p-4 sm:p-6 md:p-8 transition-colors duration-500`}
          >
            {/* If banner is a pure image banner (e.g. Netflix / Prime Video full banner) */}
            {currentBanner.type === 'image_banner' && currentBanner.imageUrl ? (
              <div className="relative w-full h-44 sm:h-56 md:h-72 rounded-2xl overflow-hidden shadow-sm">
                <img
                  src={currentBanner.imageUrl}
                  alt={currentBanner.title || 'Promotional Banner'}
                  className="w-full h-full object-cover"
                />
                {(currentBanner.title || currentBanner.subtitle) && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
                    {currentBanner.badgeText && (
                      <span className="inline-block bg-yellow-400 text-black text-[11px] font-bold px-2 py-0.5 rounded-full mb-1 w-max">
                        {currentBanner.badgeText}
                      </span>
                    )}
                    <h2 className="text-lg sm:text-2xl font-black">{currentBanner.title}</h2>
                    {currentBanner.subtitle && (
                      <p className="text-xs sm:text-sm text-gray-200 mt-0.5">
                        {currentBanner.subtitle}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Zepto Style / Custom Promo Banner (Exact Match to user reference screenshot) */
              <div className="flex flex-col items-center justify-center text-center">
                {/* Optional Top Badge */}
                {currentBanner.badgeText && (
                  <div
                    className={`inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold px-3 py-0.5 rounded-full border mb-1.5 sm:mb-2 shadow-2xs ${theme.badgeBg}`}
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{currentBanner.badgeText}</span>
                  </div>
                )}

                {/* Main Heading: "ALL NEW ZEPTO EXPERIENCE" / "ALL NEW JYOTHI MART EXPERIENCE" */}
                <h1
                  className={`text-lg sm:text-2xl md:text-3xl font-black tracking-wider uppercase mb-1 ${theme.title}`}
                >
                  {currentBanner.title || 'ALL NEW JYOTHI MART EXPERIENCE'}
                </h1>

                {/* Subtitle (if available) */}
                {currentBanner.subtitle && (
                  <p className={`text-xs sm:text-sm max-w-xl mx-auto mb-2 ${theme.subtitle}`}>
                    {currentBanner.subtitle}
                  </p>
                )}

                {/* Middle Two Highlight Cards (₹0 FEES & EVERYDAY LOW PRICES*) */}
                <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-2.5 sm:my-4">
                  {/* Card 1 */}
                  <div
                    className={`bg-white rounded-2xl p-4 sm:p-5 shadow-xs border ${theme.cardBorder} flex items-center justify-center gap-3 sm:gap-4 hover:shadow-md transition-shadow`}
                  >
                    {renderCardIcon(currentBanner.card1Icon || 'bag', currentBanner.bgTheme)}
                    <div className="text-left">
                      <div
                        className={`text-2xl sm:text-3xl md:text-4xl font-black tracking-tight ${theme.cardText}`}
                      >
                        {currentBanner.card1Text || '₹0 FEES'}
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div
                    className={`bg-white rounded-2xl p-4 sm:p-5 shadow-xs border ${theme.cardBorder} flex items-center justify-center gap-3 sm:gap-4 hover:shadow-md transition-shadow`}
                  >
                    {renderCardIcon(
                      currentBanner.card2Icon || 'price_down',
                      currentBanner.bgTheme
                    )}
                    <div className="text-left">
                      <div
                        className={`text-lg sm:text-xl md:text-2xl font-black uppercase tracking-tight leading-tight ${theme.cardText}`}
                      >
                        {currentBanner.card2Text || 'EVERYDAY LOW PRICES*'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row of 3 Feature Checks */}
                {Array.isArray(currentBanner.features) && currentBanner.features.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-6 mt-1 sm:mt-2">
                    {currentBanner.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-1.5 sm:space-x-2 bg-white/60 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-full border border-purple-100 sm:border-0 shadow-2xs sm:shadow-none"
                      >
                        <span
                          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full ${theme.checkBg} text-white flex items-center justify-center flex-shrink-0 shadow-xs`}
                        >
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
                        </span>
                        <span
                          className={`text-xs sm:text-sm font-bold tracking-tight ${theme.featureText}`}
                        >
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Terms / Disclaimer Note */}
                {currentBanner.termsText && (
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-2.5 sm:mt-3">
                    {currentBanner.termsText}
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Arrows (Desktop / Tablet) */}
        {slideList.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              aria-label="Previous slide"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md backdrop-blur-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer z-10 opacity-70 hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              aria-label="Next slide"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md backdrop-blur-xs flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer z-10 opacity-70 hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Slide Dots / Pill Indicators (Like Amazon / Netflix / Zepto) */}
      {slideList.length > 1 && (
        <div className="flex items-center justify-center space-x-1.5 mt-2.5">
          {slideList.map((slide, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={slide.id || idx}
                onClick={() => goToSlide(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  isActive
                    ? `w-6 h-1.5 sm:w-7 sm:h-2 ${theme.dotActive} shadow-xs`
                    : 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-300 hover:bg-gray-400'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
