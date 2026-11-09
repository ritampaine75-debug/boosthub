window.BOOSTHUB_CATALOG = {
  platforms: {
    instagram: {
      name: "Instagram",
      tagline: "Followers, Reels Views, Likes & Story Reach",
      services: [
        {
          id: "101",
          name: "Instagram Followers — Standard Boost",
          category: "Instagram Followers",
          ratePer1k: 120,
          min: 50,
          max: 25000,
          eta: "15 – 45 mins",
          description: "Steady delivery for public Instagram profiles. Make sure your account is set to public before placing an order."
        },
        {
          id: "102",
          name: "Instagram Followers — High Retention (30-Day Refill)",
          category: "Instagram Followers",
          ratePer1k: 210,
          min: 100,
          max: 50000,
          eta: "10 – 30 mins",
          description: "Higher profile quality with an automated 30-day drop protection refill window."
        },
        {
          id: "103",
          name: "Instagram Reels & Video Views",
          category: "Instagram Views",
          ratePer1k: 18,
          min: 100,
          max: 500000,
          eta: "Instant – 10 mins",
          description: "Fast view boost tailored for Instagram Reels and standard video posts."
        },
        {
          id: "104",
          name: "Instagram Post Likes — Fast",
          category: "Instagram Likes",
          ratePer1k: 45,
          min: 50,
          max: 50000,
          eta: "5 – 20 mins",
          description: "Quick like delivery for photos, carousels, and Reels."
        },
        {
          id: "105",
          name: "Instagram Story Views + Impressions",
          category: "Instagram Story Views",
          ratePer1k: 35,
          min: 100,
          max: 20000,
          eta: "5 – 15 mins",
          description: "Boost story reach on active 24-hour Instagram stories."
        },
        {
          id: "106",
          name: "Instagram Saves & Shares Bundle",
          category: "Instagram Engagement",
          ratePer1k: 65,
          min: 50,
          max: 15000,
          eta: "15 – 30 mins",
          description: "Improve post engagement signals with combined saves and shares."
        }
      ]
    },
    facebook: {
      name: "Facebook",
      tagline: "Page Followers, Post Reactions & Reels Views",
      services: [
        {
          id: "201",
          name: "Facebook Page Followers + Likes",
          category: "Facebook Followers",
          ratePer1k: 145,
          min: 100,
          max: 25000,
          eta: "30 – 90 mins",
          description: "Grow public Facebook Page followers and page likes steadily."
        },
        {
          id: "202",
          name: "Facebook Post Likes",
          category: "Facebook Post Engagement",
          ratePer1k: 55,
          min: 50,
          max: 20000,
          eta: "10 – 30 mins",
          description: "Boost likes on public Facebook status updates, photos, and shared links."
        },
        {
          id: "203",
          name: "Facebook Reels & Video Views",
          category: "Facebook Views",
          ratePer1k: 28,
          min: 200,
          max: 250000,
          eta: "10 – 25 mins",
          description: "Rapid view delivery for public Facebook Reels and uploaded videos."
        },
        {
          id: "204",
          name: "Facebook Group Members",
          category: "Facebook Groups",
          ratePer1k: 190,
          min: 100,
          max: 10000,
          eta: "1 – 6 hours",
          description: "Increase member count for public Facebook community groups."
        }
      ]
    },
    youtube: {
      name: "YouTube",
      tagline: "Subscribers, Watch Time, Views & Video Likes",
      services: [
        {
          id: "301",
          name: "YouTube Video & Shorts Views",
          category: "YouTube Views",
          ratePer1k: 85,
          min: 100,
          max: 500000,
          eta: "15 – 60 mins",
          description: "Reliable view delivery compatible with standard YouTube videos and Shorts."
        },
        {
          id: "302",
          name: "YouTube Channel Subscribers",
          category: "YouTube Subscribers",
          ratePer1k: 490,
          min: 50,
          max: 10000,
          eta: "1 – 12 hours",
          description: "Gradual subscriber delivery. Keep your channel subscriber count visible while ordering."
        },
        {
          id: "303",
          name: "YouTube Video Likes",
          category: "YouTube Likes",
          ratePer1k: 75,
          min: 50,
          max: 25000,
          eta: "10 – 30 mins",
          description: "Fast thumbs-up engagement for any public YouTube video or Short."
        },
        {
          id: "304",
          name: "YouTube Watch Hours (15+ Min Video)",
          category: "YouTube Watch Time",
          ratePer1k: 950,
          min: 100,
          max: 4000,
          eta: "12 – 48 hours",
          description: "Long-retention playback sessions designed for videos 15 minutes or longer."
        }
      ]
    }
  },
  getAllServices: function () {
    var list = [];
    var keys = Object.keys(this.platforms);
    for (var i = 0; i < keys.length; i++) {
      var pKey = keys[i];
      var p = this.platforms[pKey];
      for (var j = 0; j < p.services.length; j++) {
        list.push(Object.assign({ platform: pKey, platformName: p.name }, p.services[j]));
      }
    }
    return list;
  },
  getById: function (id) {
    var all = this.getAllServices();
    for (var i = 0; i < all.length; i++) {
      if (String(all[i].id) === String(id)) return all[i];
    }
    return all[0] || null;
  }
};
