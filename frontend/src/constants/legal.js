// Contact address and dates shown on the privacy policy and terms.
export const CONTACT_EMAIL = "aksharchanchlani7006@gmail.com";
export const LEGAL_UPDATED = "15 October 2026";

// Plain-English text for each page. Every statement is about something the app really does:
// check it against the code whenever a feature changes what is stored or who receives it.
export const LEGAL = {
  privacy: {
    title: "Privacy policy",
    intro:
      "Arivo AI is a personal project run by Akshar Chanchlani, a student in the UK. This page explains what the site keeps about you, why, who else handles it, and what you can do about it.",
    sections: [
      {
        h: "What we keep",
        items: [
          "Your account: your name, your email address, and your password. The password is stored as a one-way hash, so nobody, including me, can read it.",
          "Details you choose to give: your visa type and end date, your target role and what you are looking for.",
          "Your CV, if you upload it: we keep the text we read from it (up to 20,000 characters) and the skills found. The PDF file itself is deleted as soon as it has been read.",
          "What you create in the app: the jobs in your tracker with your notes, saved interview packs, your latest CV check result, skill gap results, and the roles the Sponsorship Scout picked for you.",
          "Feedback you send from the app: your message, which screen you were on, an optional rating, and your email only if you tick the box saying I may reply.",
          "Technical records kept by our hosting providers, such as your IP address in server logs.",
        ],
      },
      {
        h: "What we use it for",
        items: [
          "To run the features you ask for: job search, the visa salary check, CV checks, interview practice, the Scout and the coach.",
          "To email you: confirming your address, resetting your password, and the Scout's list if you turned it on. Nothing else.",
          "To keep the service secure and working.",
          "We do not sell your data, show adverts, or use tracking or analytics tools.",
        ],
      },
      {
        h: "Who else handles it",
        body: "These services process data for us. Some are outside the UK and work under their own terms and safeguards.",
        items: [
          "Vercel hosts the website. Render runs the backend. Hugging Face runs the AI service. MongoDB Atlas stores the database.",
          "Groq's language model receives the text needed to answer you: parts of your CV, job descriptions and what you type in the coach or interview practice, to produce a reply.",
          "Reed and Adzuna receive job search words such as a role and a place. They do not receive your name or account.",
          "Google sends our emails. They go out through a Gmail account, so your email address and the message pass through Google.",
          "Google Fonts delivers the site's typefaces, so your browser contacts Google when a page loads. Google can see your IP address when that happens.",
        ],
      },
      {
        h: "Computer-generated content",
        body: "Questions, feedback and summaries are written by an AI model. They are practice material and general information, not decisions about you, and they can be wrong.",
      },
      {
        h: "How long we keep it",
        body: "Until you delete it. Deleting your account removes your profile, CV text, tracker, saved packs and Scout picks from our database straight away. Our hosting providers may keep short-lived logs or backups of their own.",
      },
      {
        h: "Your rights",
        body: "Under UK data protection law you can ask to see, correct, move or delete your data, and you can object to how it is used.",
        items: [
          "See and take a copy: Profile, then Overview, then Download my data.",
          "Correct it: edit your details and skills in your profile.",
          "Delete it: Profile, then Overview, then Delete my account.",
          "Stop emails: turn the Scout off on your dashboard, or use the link in any Scout email.",
          "For anything else, write to the address below. If you are unhappy with the answer you can complain to the Information Commissioner's Office at ico.org.uk.",
        ],
      },
      {
        h: "Cookies and browser storage",
        body: "We do not use tracking cookies. The site keeps a few things in your browser so it works: your sign-in, your light or dark choice, a copy of your target role and skills, your recent searches and the jobs you saved. They stay on your device and are removed when you sign out or clear your browser data.",
      },
      {
        h: "Security",
        body: "Connections are encrypted. Passwords are hashed. Password and confirmation links are single-use and expire. The AI service only answers signed-in people. No system is perfectly secure, and if something affecting your data went wrong I would tell you.",
      },
      {
        h: "Who it is for",
        body: "Arivo is for adults, mainly university students. It is not aimed at anyone under 16.",
      },
      {
        h: "Changes",
        body: "If this page changes in a way that matters, the date at the top changes too, and I will say so in the app.",
      },
    ],
  },
  terms: {
    title: "Terms of use",
    intro:
      "These are the ground rules for using Arivo AI. Using the site means you accept them. They are written to be read, so please do.",
    sections: [
      {
        h: "What Arivo is",
        body: "A free tool that helps international students look for work in the UK: job search, CV checks, interview practice and information about visa sponsorship. It is a personal project, not a company, an employer or a recruiter.",
      },
      {
        h: "It is information, not advice",
        items: [
          "Nothing here is immigration, legal or career advice. For decisions about your visa, check gov.uk and talk to your university's international student advisers or a regulated adviser.",
          "A badge saying an employer is on the Home Office register does not mean a particular role is sponsored. Always confirm with the employer.",
          "The salary check compares a listed salary with figures published on gov.uk on the date shown. It cannot see the going rate for a job's occupation, and the rules change.",
          "AI-generated questions, feedback and summaries can be wrong. Use them as practice material.",
        ],
      },
      {
        h: "Jobs from other sites",
        body: "Listings come from employers' own pages, Reed and Adzuna. I do not control or endorse them and cannot promise they are accurate or still open. Take the usual care with any job offer, and never pay to apply.",
      },
      {
        h: "Your account",
        items: [
          "Give accurate details and keep your password safe. You are responsible for what happens under your account.",
          "Only upload a CV that is yours or that you have the right to use.",
          "You can delete your account at any time from your profile.",
        ],
      },
      {
        h: "Please do not",
        items: [
          "attack, probe or overload the service, or try to get around its limits",
          "collect data from the site automatically",
          "use it to harm, mislead or harass anyone, or to upload unlawful material",
        ],
        body: "Accounts that do may be suspended.",
      },
      {
        h: "Availability",
        body: "The site runs on free hosting and can be slow or unavailable, particularly the first time after a quiet spell. Features may change or stop, and I may end the service. I will try to give notice, and you can always delete your data.",
      },
      {
        h: "Liability",
        body: "The service is provided as it is. To the extent the law allows, I am not responsible for losses that come from relying on it, such as a missed job or a visa decision. Nothing in these terms limits anything the law does not allow to be limited.",
      },
      {
        h: "Governing law",
        body: "The law of England and Wales applies to these terms.",
      },
    ],
  },
};
