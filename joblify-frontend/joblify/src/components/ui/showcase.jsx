import * as React from "react"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Input } from "./input"
import { LoadingSpinner, LoadingDots, LoadingBar, LoadingSkeleton } from "./loading"
import { StatsCard, StatsIcon, StatsValue, StatsLabel, StatsGrid } from "./stats"
import { TestimonialCard, TestimonialRating, TestimonialQuote, TestimonialAuthor, TestimonialsGrid } from "./testimonials"
import { FeatureCard, FeatureIcon, FeatureTitle, FeatureDescription, FeatureNumber, FeatureArrow, FeatureGrid } from "./feature-card"
import { HeroSection, HeroContent, HeroTitle, HeroSubtitle, HeroActions, HeroBackground, HeroBlob } from "./hero"
import { Section, SectionHeader, SectionTitle, SectionSubtitle, SectionContent, SectionGrid } from "./section"
import { CTASection, CTATitle, CTADescription, CTAActions, CTABackground, CTABlob } from "./cta"
import { NewsletterCard, NewsletterHeader, NewsletterTitle, NewsletterDescription, NewsletterForm, NewsletterInput, NewsletterButton, NewsletterGrid } from "./newsletter"
import { SocialMediaLink, SocialMediaGrid, SocialIcons } from "./social-media"
import { Navigation, NavigationItem, NavigationDropdown, NavigationDropdownItem, NavigationGroup, NavigationSeparator } from "./navigation"
import { MobileMenu, MobileMenuHeader, MobileMenuTitle, MobileMenuContent, MobileMenuItem, MobileMenuButton, MobileMenuGroup, MobileMenuSeparator, MobileMenuToggle } from "./mobile-menu"
import { SearchContainer, SearchInput, SearchIcon, SearchClearButton, SearchSuggestions, SearchPopular } from "./search"
import { Form, FormGroup, FormLabel, FormInput, FormTextarea, FormSelect, FormOption, FormCheckbox, FormRadio, FormError, FormHelp, FormActions } from "./form"
import { Layout, LayoutHeader, LayoutMain, LayoutFooter, LayoutSidebar, LayoutContent, LayoutContainer, LayoutGrid, LayoutFlex, LayoutSection } from "./layout"
import { Typography, Heading, Title, Subtitle, Paragraph, Text, Caption, Blockquote, Code, Pre } from "./typography"
import { Animation, FadeIn, SlideUp, BounceIn, ScaleIn, RotateIn, FlipIn, ZoomIn, Pulse, Spin, Wiggle, Shake, Float, Glow, Shimmer, Heartbeat, RubberBand, Swing, Tada, Wobble, Hinge, RollIn, RollOut, LightSpeedIn, LightSpeedOut, FlipInX, FlipInY, FlipOutX, FlipOutY, BounceInAnimation, BounceOut, FadeInAnimation, FadeOut, SlideInUp, SlideInDown, SlideInLeft, SlideInRight, SlideOutUp, SlideOutDown, SlideOutLeft, SlideOutRight, ZoomInAnimation, ZoomOut, RotateInAnimation, RotateOut, HingeIn, HingeOut, JackInTheBox } from "./animation"
import { Icon, SearchIcon, LocationIcon, ClockIcon, CalendarIcon, EyeIcon, CheckIcon, XIcon, PlusIcon, MinusIcon, ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon, ArrowRightIcon, ArrowLeftIcon, StarIcon, HeartIcon, UserIcon, SettingsIcon, MenuIcon, CloseIcon } from "./icon"
import { Utility, Divider, Spacer, Container, Grid, Flex, Stack, Center, AspectRatio, VisuallyHidden, FocusTrap, Portal } from "./utility"
import { Theme, ThemeProvider, ThemeToggle, ThemeSwitcher, ThemePreview } from "./theme"

const Showcase = () => {
  const [currentTheme, setCurrentTheme] = React.useState("light")
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  return (
    <ThemeProvider theme={currentTheme}>
      <Layout>
        <LayoutHeader>
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-xl font-bold">🎨</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">UI Showcase</h1>
                  <p className="text-muted-foreground">Beautiful Components Gallery</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <ThemeSwitcher 
                  currentTheme={currentTheme} 
                  onThemeChange={setCurrentTheme} 
                />
                <MobileMenuToggle 
                  isOpen={isMenuOpen} 
                  onClick={() => setIsMenuOpen(!isMenuOpen)} 
                />
              </div>
            </div>
          </div>
        </LayoutHeader>

        <LayoutMain>
          {/* Hero Section */}
          <HeroSection variant="gradient" size="lg" pattern="waves">
            <HeroContent>
              <HeroTitle>Beautiful UI Components</HeroTitle>
              <HeroSubtitle>
                Explore our comprehensive collection of elegant, accessible, and customizable UI components
                designed to create stunning user experiences.
              </HeroSubtitle>
              <HeroActions>
                <Button size="lg" variant="secondary">Get Started</Button>
                <Button size="lg" variant="outline">View Components</Button>
              </HeroActions>
            </HeroContent>
            <HeroBackground>
              <HeroBlob position="top-20 left-10" size="w-72 h-72" />
              <HeroBlob position="bottom-20 right-10" size="w-80 h-80" delay="1000" />
            </HeroBackground>
          </HeroSection>

          {/* Components Showcase */}
          <LayoutSection variant="default" size="lg">
            <SectionHeader>
              <SectionTitle>Core Components</SectionTitle>
              <SectionSubtitle>
                Essential building blocks for modern web applications
              </SectionSubtitle>
            </SectionHeader>

            <SectionContent>
              {/* Buttons */}
              <div className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">Buttons</h3>
                <div className="flex flex-wrap gap-4">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="gradient">Gradient</Button>
                  <Button variant="glass">Glass</Button>
                </div>
                <div className="flex flex-wrap gap-4 mt-4">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="xl">Extra Large</Button>
                </div>
              </div>

              {/* Cards */}
              <div className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card variant="default">
                    <CardHeader>
                      <CardTitle>Default Card</CardTitle>
                      <CardDescription>Beautiful default card design</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>This is a beautiful card with elegant styling and smooth transitions.</p>
                    </CardContent>
                  </Card>
                  <Card variant="elevated">
                    <CardHeader>
                      <CardTitle>Elevated Card</CardTitle>
                      <CardDescription>Card with enhanced shadows</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>This card features enhanced shadows and hover effects.</p>
                    </CardContent>
                  </Card>
                  <Card variant="glass">
                    <CardHeader>
                      <CardTitle>Glass Card</CardTitle>
                      <CardDescription>Modern glass morphism design</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>This card uses glass morphism with backdrop blur effects.</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Badges */}
              <div className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">Badges</h3>
                <div className="flex flex-wrap gap-4">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="info">Info</Badge>
                  <Badge variant="premium">Premium</Badge>
                </div>
              </div>

              {/* Inputs */}
              <div className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">Inputs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Default Input</label>
                    <Input placeholder="Enter your text..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Search Input</label>
                    <SearchContainer variant="default" focus="glow">
                      <SearchIcon icon="search" />
                      <SearchInput placeholder="Search..." />
                    </SearchContainer>
                  </div>
                </div>
              </div>

              {/* Loading States */}
              <div className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">Loading States</h3>
                <div className="flex flex-wrap items-center gap-8">
                  <div className="text-center">
                    <LoadingSpinner size="lg" className="mb-2" />
                    <p className="text-sm text-muted-foreground">Spinner</p>
                  </div>
                  <div className="text-center">
                    <LoadingDots size="lg" className="mb-2" />
                    <p className="text-sm text-muted-foreground">Dots</p>
                  </div>
                  <div className="text-center">
                    <LoadingBar size="lg" className="mb-2" />
                    <p className="text-sm text-muted-foreground">Bar</p>
                  </div>
                  <div className="text-center">
                    <LoadingSkeleton size="lg" className="mb-2" />
                    <p className="text-sm text-muted-foreground">Skeleton</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">Statistics</h3>
                <StatsGrid cols={4}>
                  <StatsCard variant="elevated" animation="hover">
                    <StatsIcon>📊</StatsIcon>
                    <StatsValue>1,234</StatsValue>
                    <StatsLabel>Total Users</StatsLabel>
                  </StatsCard>
                  <StatsCard variant="gradient" animation="hover">
                    <StatsIcon>🚀</StatsIcon>
                    <StatsValue>567</StatsValue>
                    <StatsLabel>Active Projects</StatsLabel>
                  </StatsCard>
                  <StatsCard variant="glass" animation="hover">
                    <StatsIcon>⭐</StatsIcon>
                    <StatsValue>98.5%</StatsValue>
                    <StatsLabel>Satisfaction Rate</StatsLabel>
                  </StatsCard>
                  <StatsCard variant="premium" animation="hover">
                    <StatsIcon>💎</StatsIcon>
                    <StatsValue>89</StatsValue>
                    <StatsLabel>Premium Features</StatsLabel>
                  </StatsCard>
                </StatsGrid>
              </div>

              {/* Features */}
              <div className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">Features</h3>
                <FeatureGrid cols={3}>
                  <FeatureCard variant="elevated" animation="hover">
                    <FeatureIcon>🎨</FeatureIcon>
                    <FeatureTitle>Beautiful Design</FeatureTitle>
                    <FeatureDescription>
                      Elegant and modern design that captivates users and enhances their experience.
                    </FeatureDescription>
                  </FeatureCard>
                  <FeatureCard variant="gradient" animation="hover">
                    <FeatureIcon>⚡</FeatureIcon>
                    <FeatureTitle>Lightning Fast</FeatureTitle>
                    <FeatureDescription>
                      Optimized performance that ensures smooth interactions and quick loading times.
                    </FeatureDescription>
                  </FeatureCard>
                  <FeatureCard variant="glass" animation="hover">
                    <FeatureIcon>🔒</FeatureIcon>
                    <FeatureTitle>Secure & Reliable</FeatureTitle>
                    <FeatureDescription>
                      Built with security in mind, providing a safe and trustworthy platform.
                    </FeatureDescription>
                  </FeatureCard>
                </FeatureGrid>
              </div>

              {/* Testimonials */}
              <div className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">Testimonials</h3>
                <TestimonialsGrid cols={2}>
                  <TestimonialCard variant="elevated" animation="hover">
                    <TestimonialRating rating={5} />
                    <TestimonialQuote>
                      This UI library has completely transformed our development process. The components are not only beautiful but also highly customizable.
                    </TestimonialQuote>
                    <TestimonialAuthor
                      name="Sarah Johnson"
                      title="Lead Designer"
                      company="TechCorp"
                    />
                  </TestimonialCard>
                  <TestimonialCard variant="glass" animation="hover">
                    <TestimonialRating rating={5} />
                    <TestimonialQuote>
                      The attention to detail and smooth animations make our applications feel premium and professional.
                    </TestimonialQuote>
                    <TestimonialAuthor
                      name="Michael Chen"
                      title="Frontend Developer"
                      company="InnovateLab"
                    />
                  </TestimonialCard>
                </TestimonialsGrid>
              </div>

              {/* Newsletter */}
              <div className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">Newsletter</h3>
                <NewsletterCard variant="gradient" size="lg">
                  <NewsletterHeader>
                    <NewsletterTitle>Stay Updated</NewsletterTitle>
                    <NewsletterDescription>
                      Get the latest updates on new components, features, and design trends delivered to your inbox.
                    </NewsletterDescription>
                  </NewsletterHeader>
                  <NewsletterForm>
                    <NewsletterInput placeholder="Enter your email" />
                    <NewsletterButton>Subscribe</NewsletterButton>
                  </NewsletterForm>
                </NewsletterCard>
              </div>

              {/* Social Media */}
              <div className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">Social Media</h3>
                <SocialMediaGrid>
                  <SocialMediaLink href="#" icon={<SocialIcons.github />} label="GitHub" />
                  <SocialMediaLink href="#" icon={<SocialIcons.twitter />} label="Twitter" />
                  <SocialMediaLink href="#" icon={<SocialIcons.linkedin />} label="LinkedIn" />
                  <SocialMediaLink href="#" icon={<SocialIcons.instagram />} label="Instagram" />
                  <SocialMediaLink href="#" icon={<SocialIcons.discord />} label="Discord" />
                </SocialMediaGrid>
              </div>

              {/* Animations */}
              <div className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">Animations</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FadeIn>
                    <Card className="p-4 text-center">
                      <p>Fade In</p>
                    </Card>
                  </FadeIn>
                  <SlideUp>
                    <Card className="p-4 text-center">
                      <p>Slide Up</p>
                    </Card>
                  </SlideUp>
                  <BounceIn>
                    <Card className="p-4 text-center">
                      <p>Bounce In</p>
                    </Card>
                  </BounceIn>
                  <ScaleIn>
                    <Card className="p-4 text-center">
                      <p>Scale In</p>
                    </Card>
                  </ScaleIn>
                </div>
              </div>

              {/* Typography */}
              <div className="mb-12">
                <h3 className="text-2xl font-semibold mb-6">Typography</h3>
                <div className="space-y-4">
                  <Heading level={1} variant="gradient">Heading 1</Heading>
                  <Heading level={2}>Heading 2</Heading>
                  <Heading level={3}>Heading 3</Heading>
                  <Title variant="gradient">Title</Title>
                  <Subtitle>Subtitle</Subtitle>
                  <Paragraph>
                    This is a beautiful paragraph with elegant typography and proper spacing.
                  </Paragraph>
                  <Blockquote>
                    "Design is not just what it looks like and feels like. Design is how it works."
                  </Blockquote>
                </div>
              </div>
            </SectionContent>
          </LayoutSection>

          {/* CTA Section */}
          <CTASection variant="gradient" size="lg" pattern="waves">
            <CTATitle>Ready to Get Started?</CTATitle>
            <CTADescription>
              Join thousands of developers who are already building beautiful applications with our components.
            </CTADescription>
            <CTAActions>
              <Button size="lg" variant="secondary">Download Now</Button>
              <Button size="lg" variant="outline">View Documentation</Button>
            </CTAActions>
          </CTASection>
        </LayoutMain>

        <LayoutFooter>
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-xl font-bold">🎨</span>
                  </div>
                  <span className="text-xl font-bold">UI Showcase</span>
                </div>
                <p className="text-muted-foreground">
                  Beautiful, accessible, and customizable UI components for modern web applications.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Components</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Buttons</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Cards</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Forms</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Navigation</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Examples</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Tutorials</a></li>
                  <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Connect</h4>
                <div className="flex space-x-4">
                  <SocialMediaLink href="#" icon={<SocialIcons.github />} label="GitHub" />
                  <SocialMediaLink href="#" icon={<SocialIcons.twitter />} label="Twitter" />
                  <SocialMediaLink href="#" icon={<SocialIcons.discord />} label="Discord" />
                </div>
              </div>
            </div>
            <div className="border-t border-border/50 mt-8 pt-8 text-center text-muted-foreground">
              <p>&copy; 2024 UI Showcase. All rights reserved.</p>
            </div>
          </div>
        </LayoutFooter>
      </Layout>

      {/* Mobile Menu */}
      <MobileMenu isOpen={isMenuOpen} variant="glass">
        <MobileMenuHeader>
          <MobileMenuTitle>Menu</MobileMenuTitle>
        </MobileMenuHeader>
        <MobileMenuContent>
          <MobileMenuGroup title="Components">
            <MobileMenuItem href="#buttons">Buttons</MobileMenuItem>
            <MobileMenuItem href="#cards">Cards</MobileMenuItem>
            <MobileMenuItem href="#forms">Forms</MobileMenuItem>
            <MobileMenuItem href="#navigation">Navigation</MobileMenuItem>
          </MobileMenuGroup>
          <MobileMenuSeparator />
          <MobileMenuGroup title="Actions">
            <MobileMenuButton variant="default" onClick={() => setIsMenuOpen(false)}>
              Get Started
            </MobileMenuButton>
          </MobileMenuGroup>
        </MobileMenuContent>
      </MobileMenu>
    </ThemeProvider>
  )
}

export { Showcase } 