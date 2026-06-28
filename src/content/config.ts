import { z, defineCollection } from "astro:content";

const basicsCollection = defineCollection({
  type: "data",
  schema: z.object({
    name: z.string(),
    title: z.string(),
    tagline: z.string(),
    location: z.string(),
    email: z.string().email(),
    github: z.string().url(),
    avatar: z.string().optional(),
    social: z
      .array(
        z.object({
          platform: z.string(),
          url: z.string().url(),
        })
      )
      .optional(),
  }),
});

const experienceCollection = defineCollection({
  type: "data",
  schema: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      period: z.string(),
      url: z.string().url().optional(),
      highlights: z.array(z.string()),
    })
  ),
});

const skillsCollection = defineCollection({
  type: "data",
  schema: z.object({
    categories: z.array(
      z.object({
        name: z.string(),
        items: z.array(
          z.object({
            name: z.string(),
            level: z.number().min(0).max(100).optional(),
          })
        ),
      })
    ),
  }),
});

const educationCollection = defineCollection({
  type: "data",
  schema: z.array(
    z.object({
      school: z.string(),
      degree: z.string(),
      field: z.string(),
      period: z.string(),
      highlights: z.array(z.string()).optional(),
    })
  ),
});

const projectsCollection = defineCollection({
  type: "data",
  schema: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      period: z.string().optional(),
      url: z.string().url().optional(),
      github: z.string().url().optional(),
      stars: z.number().optional(),
      tech: z.array(z.string()),
      highlights: z.array(z.string()).optional(),
    })
  ),
});

export const collections = {
  basics: basicsCollection,
  experience: experienceCollection,
  skills: skillsCollection,
  education: educationCollection,
  projects: projectsCollection,
};
