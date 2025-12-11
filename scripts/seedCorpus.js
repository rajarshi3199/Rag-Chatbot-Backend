/**
 * Seed news corpus into vector database
 * Uses sample news articles on various topics
 */

import { getEmbeddings } from '../src/services/embeddingService.js';
import { addDocuments, initializeVectorDB } from '../src/services/vectorService.js';
import dotenv from 'dotenv';

dotenv.config();

// Sample news articles corpus
const newsArticles = [
  {
    id: 'news_001',
    title: 'Tech Giant Announces New AI Chip',
    source: 'TechNews Daily',
    content:
      'A leading technology company announced today the release of their latest AI accelerator chip, designed to speed up machine learning workloads. The chip features advanced neural processing capabilities and is expected to reduce inference time by 50% compared to previous generations. The company plans to integrate this chip into their data centers by Q2 next year.',
  },
  {
    id: 'news_002',
    title: 'Global Climate Summit Reaches Historic Agreement',
    source: 'World News Network',
    content:
      'Nations from around the world gathered at the Global Climate Summit and agreed on ambitious targets to reduce carbon emissions. The agreement includes commitments to transition to renewable energy and protect vulnerable ecosystems. Industry experts predict this could accelerate the global shift towards sustainable practices.',
  },
  {
    id: 'news_003',
    title: 'Stock Market Hits Record High',
    source: 'Financial Times',
    content:
      'The stock market reached an all-time high today, driven by strong corporate earnings reports and optimistic economic forecasts. Technology and healthcare sectors led the gains, with investors showing increased confidence in the economic recovery. Analysts suggest this momentum could continue into the next quarter.',
  },
  {
    id: 'news_004',
    title: 'New Medical Breakthrough in Cancer Treatment',
    source: 'Health & Science Weekly',
    content:
      'Researchers announced a breakthrough in cancer immunotherapy, showing promising results in clinical trials. The new treatment approach has demonstrated a 70% success rate in early stages, with minimal side effects. The pharmaceutical company plans to file for regulatory approval within the next 18 months.',
  },
  {
    id: 'news_005',
    title: 'Renewable Energy Capacity Doubles',
    source: 'Green Energy Report',
    content:
      'Global renewable energy capacity has doubled in the past five years, driven by falling costs and government incentives. Solar and wind installations are now the fastest-growing energy sources worldwide. Experts predict renewable energy will become the dominant source of electricity within the next decade.',
  },
  {
    id: 'news_006',
    title: 'Major Cybersecurity Incident Affects Millions',
    source: 'Security Weekly',
    content:
      'A major cybersecurity breach exposed personal data of millions of users worldwide. The affected company is working with authorities to investigate the incident and has begun notifying affected users. This highlights the growing importance of robust cybersecurity measures in the digital age.',
  },
  {
    id: 'news_007',
    title: 'Space Exploration Milestone Achieved',
    source: 'Space News Today',
    content:
      'A private space company successfully landed a reusable rocket for the 100th time, marking a major milestone in commercial space exploration. The achievement demonstrates significant progress in making space travel more affordable and accessible. Future missions are planned to establish a lunar base within five years.',
  },
  {
    id: 'news_008',
    title: 'Artificial Intelligence Transforms Healthcare',
    source: 'Medical Technology Journal',
    content:
      'Artificial intelligence is revolutionizing healthcare through faster diagnosis and personalized treatment plans. AI algorithms can now detect diseases from medical images with accuracy exceeding human radiologists. Hospitals worldwide are integrating AI systems to improve patient outcomes and reduce healthcare costs.',
  },
  {
    id: 'news_009',
    title: 'Global Trade Tensions Ease',
    source: 'Business International',
    content:
      'Trade negotiations between major economies have resulted in reduced tariffs and eased tensions. The agreement is expected to boost global trade and economic growth. Business leaders are optimistic about the improved market conditions.',
  },
  {
    id: 'news_010',
    title: 'Education System Embraces Digital Learning',
    source: 'Education Today',
    content:
      'Educational institutions worldwide are increasingly adopting digital learning platforms and AI tutoring systems. The shift has improved student engagement and personalized learning experiences. Experts predict a permanent transformation in how education is delivered.',
  },
  {
    id: 'news_011',
    title: 'Quantum Computing Makes Progress',
    source: 'Tech Innovation News',
    content:
      'Quantum computing researchers demonstrated new breakthroughs in error correction and qubit stability. These advances bring practical quantum computers closer to reality. Major tech companies are investing heavily in quantum computing research.',
  },
  {
    id: 'news_012',
    title: 'Transportation Industry Goes Electric',
    source: 'Auto & Transport Weekly',
    content:
      'Major automotive manufacturers announce plans to transition their entire vehicle lineups to electric by 2035. Electric vehicle sales are projected to exceed traditional combustion engines within the decade. Infrastructure for charging stations is expanding rapidly worldwide.',
  },
  {
    id: 'news_013',
    title: 'Biotech Company Develops Gene Therapy',
    source: 'Biotech Breakthroughs',
    content:
      'A biotech company has developed a promising gene therapy for treating rare genetic disorders. Early trials show complete remission in affected patients. The therapy could open new avenues for treating previously incurable genetic diseases.',
  },
  {
    id: 'news_014',
    title: 'Agricultural Innovation Increases Crop Yields',
    source: 'Agricultural Science',
    content:
      'New farming techniques using AI and precision agriculture are increasing crop yields while reducing water usage. Farmers using these methods report 40% higher productivity with 30% less water. The innovation could help address global food security challenges.',
  },
  {
    id: 'news_015',
    title: 'Cybersecurity Standards Strengthen',
    source: 'Policy & Security',
    content:
      'New international cybersecurity standards have been established to protect critical infrastructure. Governments are mandating compliance from organizations handling sensitive data. Implementation is expected to significantly reduce the risk of cyber attacks.',
  },
  {
    id: 'news_016',
    title: 'Remote Work Becomes Permanent for Many',
    source: 'Business Culture Weekly',
    content:
      'Survey shows that 60% of companies are making remote work permanent, even as offices reopen. Employees report higher satisfaction and productivity with flexible work arrangements. Real estate markets are adapting to the shift in office space demand.',
  },
  {
    id: 'news_017',
    title: 'Ocean Cleanup Initiative Shows Promise',
    source: 'Environmental News',
    content:
      'A large-scale ocean cleanup project has successfully removed thousands of tons of plastic from the Pacific Ocean. The initiative is developing scalable methods for addressing ocean pollution. Scientists predict significant environmental benefits within the next five years.',
  },
  {
    id: 'news_018',
    title: 'Neural Interface Technology Advances',
    source: 'Neurotechnology Today',
    content:
      'Researchers developed a new neural interface that allows people with paralysis to control devices with their thoughts. The technology has achieved impressive accuracy rates and shows potential for treating various neurological conditions. Clinical trials are expanding to include more patients.',
  },
  {
    id: 'news_019',
    title: 'Cryptocurrency Adoption Grows',
    source: 'Finance & Digital Assets',
    content:
      'Major corporations and financial institutions are increasingly adopting cryptocurrency for transactions and as a store of value. Bitcoin and other digital assets are gaining mainstream acceptance. Regulatory frameworks are being developed worldwide to support safe adoption.',
  },
  {
    id: 'news_020',
    title: 'Water Purification Technology Breakthrough',
    source: 'Clean Technology',
    content:
      'Scientists developed a new water purification technology that removes contaminants more efficiently than existing methods. The low-cost solution could provide clean water to millions of people in developing nations. Pilot projects are underway in multiple countries.',
  },
  {
    id: 'news_021',
    title: 'Sustainable Fashion Industry Growth',
    source: 'Fashion & Sustainability',
    content:
      'The sustainable fashion industry is experiencing rapid growth as consumers demand eco-friendly clothing. Major brands are committing to sustainable practices and reducing their carbon footprints. Analysts predict the sustainable fashion market could reach $100 billion by 2030.',
  },
  {
    id: 'news_022',
    title: 'AI Chatbots Transform Customer Service',
    source: 'Technology Innovation',
    content:
      'AI-powered chatbots are becoming increasingly sophisticated, handling complex customer service inquiries with high accuracy. Companies report improved customer satisfaction and reduced operational costs. The technology continues to evolve with better natural language understanding.',
  },
  {
    id: 'news_023',
    title: 'Renewable Battery Technology Improves',
    source: 'Energy Technology Weekly',
    content:
      'New battery technologies promise significantly higher energy density and faster charging times. These improvements are crucial for making electric vehicles and renewable energy more practical. Multiple companies are preparing for large-scale manufacturing.',
  },
  {
    id: 'news_024',
    title: 'Smart City Infrastructure Expands',
    source: 'Urban Development News',
    content:
      'Cities worldwide are investing in smart infrastructure using IoT sensors and AI for traffic management and resource optimization. These systems improve urban efficiency and reduce environmental impact. Major cities report significant improvements in quality of life metrics.',
  },
  {
    id: 'news_025',
    title: 'Mental Health Technology Gains Recognition',
    source: 'Health Tech News',
    content:
      'Digital mental health tools and teletherapy platforms are gaining acceptance from healthcare providers and insurance companies. These technologies make mental health services more accessible and affordable. Usage has increased significantly following greater awareness and reduced stigma.',
  },
  {
    id: 'news_026',
    title: 'Robotics in Manufacturing Increases Efficiency',
    source: 'Industrial Technology',
    content:
      'Advanced robotic systems are revolutionizing manufacturing with improved precision and efficiency. Companies using automation report increased productivity and quality. The technology is becoming more affordable and accessible to small and medium enterprises.',
  },
  {
    id: 'news_027',
    title: 'Genetic Testing Becomes More Accessible',
    source: 'Medical Genetics Weekly',
    content:
      'Consumer genetic testing services are becoming more popular and affordable as technology costs decrease. These tests help identify health risks and ancestry information. Privacy concerns are being addressed with new regulations and safeguards.',
  },
  {
    id: 'news_028',
    title: '5G Network Rollout Accelerates',
    source: 'Telecommunications Today',
    content:
      '5G network deployment is accelerating globally, enabling new applications in autonomous vehicles and IoT. Internet speeds and reliability are improving significantly. The technology is expected to drive economic growth across multiple sectors.',
  },
  {
    id: 'news_029',
    title: 'Augmented Reality Transforms Retail',
    source: 'Digital Retail News',
    content:
      'Augmented reality technology is revolutionizing online shopping, allowing customers to visualize products in their environment before buying. Major retailers are implementing AR features in their applications. Consumer engagement and conversion rates have increased significantly.',
  },
  {
    id: 'news_030',
    title: 'Blockchain for Supply Chain Transparency',
    source: 'Supply Chain Weekly',
    content:
      'Blockchain technology is improving supply chain transparency, allowing companies to track products from source to consumer. This increases trust and helps combat counterfeiting. Major corporations are implementing blockchain solutions in their operations.',
  },
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Initialize vector DB
    await initializeVectorDB();

    // Generate embeddings for all articles
    console.log(`📝 Processing ${newsArticles.length} articles...`);

    const articlesWithEmbeddings = [];
    for (let i = 0; i < newsArticles.length; i++) {
      const article = newsArticles[i];
      // Combine title and content for embedding
      const textToEmbed = `${article.title}\n${article.content}`;
      const embedding = await getEmbeddings(textToEmbed);

      articlesWithEmbeddings.push({
        ...article,
        embedding,
        text: article.content,
      });

      if ((i + 1) % 5 === 0) {
        console.log(`✓ Processed ${i + 1}/${newsArticles.length} articles`);
      }
    }

    // Add documents to vector store
    addDocuments(articlesWithEmbeddings);

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`📚 Total documents stored: ${newsArticles.length}`);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
