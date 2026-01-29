import { Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Globe,
  TrendingUp,
  FileText,
  Hash,
  MessageSquare,
  Image,
  Check,
  ArrowRight,
  Play,
} from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: 'Video Scripts',
    description: 'Generate engaging 20-30 second scripts optimized for TikTok and Reels.',
  },
  {
    icon: Zap,
    title: 'Hook Ideas',
    description: 'Get 10 attention-grabbing hooks to stop the scroll in the first 3 seconds.',
  },
  {
    icon: MessageSquare,
    title: 'Captions',
    description: 'Create compelling captions with CTAs that drive engagement and sales.',
  },
  {
    icon: Hash,
    title: 'Hashtags',
    description: '20 trending and niche-specific hashtags for maximum reach.',
  },
  {
    icon: Image,
    title: 'Thumbnail Text',
    description: 'Eye-catching text suggestions for your video thumbnails.',
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    description: 'Generate content in Arabic, English, and 14+ other languages.',
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for trying out',
    features: [
      '10 content generations/month',
      'Basic TikTok scripts',
      'Standard hooks & captions',
      '20 hashtags per generation',
      'Email support',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$19',
    period: '/month',
    description: 'For serious creators',
    features: [
      '100 content generations/month',
      'Advanced TikTok scripts',
      'Multiple creative angles',
      'Platform-specific optimization',
      'All languages supported',
      'Priority support',
      'Content history',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Business',
    price: '$49',
    period: '/month',
    description: 'For teams & agencies',
    features: [
      'Unlimited generations',
      'Premium TikTok scripts',
      'All creative angles & hooks',
      'Multi-platform support',
      'All languages & tones',
      'API access',
      'Dedicated support',
      'Team collaboration (soon)',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

const faqs = [
  {
    question: 'What platforms does ContentGen support?',
    answer: 'ContentGen supports TikTok, Instagram Reels, Instagram Stories, YouTube Shorts, Facebook Reels, Snapchat, Twitter/X, LinkedIn, Pinterest, and various ad platforms.',
  },
  {
    question: 'What languages are supported?',
    answer: 'We support Arabic (Modern Standard, Egyptian, Saudi, UAE, Moroccan, Levantine), English, French, Spanish, German, Turkish, Urdu, Hindi, Indonesian, and Malay.',
  },
  {
    question: 'How does the AI generate content?',
    answer: 'Our AI analyzes your product information and generates optimized content based on the platform, language, tone, and niche you select. It creates scripts, hooks, captions, hashtags, and thumbnail text tailored for maximum engagement.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.',
  },
  {
    question: 'Is there an API available?',
    answer: 'Yes, API access is available on the Business plan. You can integrate ContentGen directly into your workflow or application.',
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white py-20 lg:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered Content Generation
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Create Viral TikTok Content in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-600">
                Seconds
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Generate scripts, hooks, captions, and hashtags for TikTok, Instagram, and more. 
              Perfect for dropshippers, influencers, and content creators.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary btn-lg gap-2 w-full sm:w-auto">
                Start Free <ArrowRight className="w-5 h-5" />
              </Link>
              <button className="btn-outline btn-lg gap-2 w-full sm:w-auto">
                <Play className="w-5 h-5" /> Watch Demo
              </button>
            </div>
            
            <p className="mt-6 text-sm text-gray-500">
              No credit card required • 10 free generations
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Go Viral
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              One click generates a complete content package for your product
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Generate viral content in 3 simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Add Your Product',
                description: 'Enter your product details or paste a link from AliExpress, Amazon, or any store.',
              },
              {
                step: '2',
                title: 'Choose Settings',
                description: 'Select your language, platform, tone, and niche for targeted content.',
              },
              {
                step: '3',
                title: 'Generate & Use',
                description: 'Get your complete content package: script, hooks, captions, hashtags, and more.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card p-8 relative ${
                  plan.popular ? 'border-2 border-primary-500 shadow-lg' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-500">{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  to="/register"
                  className={`w-full ${plan.popular ? 'btn-primary' : 'btn-outline'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 lg:py-32 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq) => (
              <div key={faq.question} className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-r from-primary-600 to-accent-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Create Viral Content?
          </h2>
          <p className="text-xl text-white/80 mb-10">
            Join thousands of creators using ContentGen to grow their audience
          </p>
          <Link to="/register" className="btn bg-white text-primary-600 hover:bg-gray-100 btn-lg gap-2">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
