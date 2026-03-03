import React, { useState } from "react"
import { 
  Dashboard, 
  DashboardHeader, 
  DashboardCard, 
  DashboardMetric, 
  DashboardGrid, 
  DashboardLayout,
  DashboardSidebar,
  DashboardContent,
  DashboardChart,
  DashboardTable,
  DashboardWidget,
  DashboardProgress,
  DashboardStat
} from "../components/ui/dashboard"
import { 
  Chart, 
  LineChart, 
  AreaChart, 
  BarChart, 
  PieChart, 
  DonutChart, 
  ChartLegend 
} from "../components/ui/charts"
import { 
  Calendar, 
  CalendarMonth, 
  CalendarMini, 
  CalendarRange 
} from "../components/ui/calendar"
import { 
  Theme, 
  ThemeProvider, 
  ThemeToggle, 
  ThemeSwitcher, 
  ThemePreview 
} from "../components/ui/theme"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { LoadingSpinner, LoadingDots, LoadingBar, LoadingSkeleton } from "../components/ui/loading"
import { StatsCard, StatsIcon, StatsValue, StatsLabel, StatsGrid } from "../components/ui/stats"
import { TestimonialCard, TestimonialRating, TestimonialQuote, TestimonialAuthor, TestimonialsGrid } from "../components/ui/testimonials"
import { FeatureCard, FeatureIcon, FeatureTitle, FeatureDescription, FeatureNumber, FeatureArrow, FeatureGrid } from "../components/ui/feature-card"
import { HeroSection, HeroContent, HeroTitle, HeroSubtitle, HeroActions, HeroBackground, HeroBlob } from "../components/ui/hero"
import { Section, SectionHeader, SectionTitle, SectionSubtitle, SectionContent, SectionGrid } from "../components/ui/section"
import { CTASection, CTATitle, CTADescription, CTAActions, CTABackground, CTABlob } from "../components/ui/cta"
import { NewsletterCard, NewsletterHeader, NewsletterTitle, NewsletterDescription, NewsletterForm, NewsletterInput, NewsletterButton, NewsletterGrid } from "../components/ui/newsletter"
import { SocialMediaLink, SocialMediaGrid, SocialIcons } from "../components/ui/social-media"
import { Navigation, NavigationItem, NavigationDropdown, NavigationDropdownItem, NavigationGroup, NavigationSeparator } from "../components/ui/navigation"
import { MobileMenu, MobileMenuHeader, MobileMenuTitle, MobileMenuContent, MobileMenuItem, MobileMenuButton, MobileMenuGroup, MobileMenuSeparator, MobileMenuToggle } from "../components/ui/mobile-menu"
import { SearchContainer, SearchInput, SearchIcon, SearchClearButton, SearchSuggestions, SearchPopular } from "../components/ui/search"
import { Form, FormGroup, FormLabel, FormInput, FormTextarea, FormSelect, FormOption, FormCheckbox, FormRadio, FormError, FormHelp, FormActions } from "../components/ui/form"
import { Layout, LayoutHeader, LayoutMain, LayoutFooter, LayoutSidebar, LayoutContent, LayoutContainer, LayoutGrid, LayoutFlex, LayoutSection } from "../components/ui/layout"
import { Typography, Heading, Title, Subtitle, Paragraph, Text, Caption, Blockquote, Code, Pre } from "../components/ui/typography"
import { Animation, FadeIn, SlideUp, BounceIn, ScaleIn, RotateIn, FlipIn, ZoomIn, Pulse, Spin, Wiggle, Shake, Float, Glow, Shimmer, Heartbeat, RubberBand, Swing, Tada, Wobble, Hinge, RollIn, RollOut, LightSpeedIn, LightSpeedOut, FlipInX, FlipInY, FlipOutX, FlipOutY, BounceInAnimation, BounceOut, FadeInAnimation, FadeOut, SlideInUp, SlideInDown, SlideInLeft, SlideInRight, SlideOutUp, SlideOutDown, SlideOutLeft, SlideOutRight, ZoomInAnimation, ZoomOut, RotateInAnimation, RotateOut, HingeIn, HingeOut, JackInTheBox } from "../components/ui/animation"
import { Icon, SearchIcon, LocationIcon, ClockIcon, CalendarIcon, EyeIcon, CheckIcon, XIcon, PlusIcon, MinusIcon, ChevronDownIcon, ChevronUpIcon, ChevronLeftIcon, ChevronRightIcon, ArrowRightIcon, ArrowLeftIcon, StarIcon, HeartIcon, UserIcon, SettingsIcon, MenuIcon, CloseIcon } from "../components/ui/icon"
import { Utility, Divider, Spacer, Container, Grid, Flex, Stack, Center, AspectRatio, VisuallyHidden, FocusTrap, Portal } from "../components/ui/utility"

export default function ShowcasePage() {
  const [currentTheme, setCurrentTheme] = useState("light")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Sample data for charts
  const lineChartData = [
    { value: 10, label: "Jan" },
    { value: 25, label: "Feb" },
    { value: 15, label: "Mar" },
    { value: 40, label: "Apr" },
    { value: 30, label: "May" },
    { value: 50, label: "Jun" },
  ]

  const pieChartData = [
    { value: 30, label: "React", color: "#61dafb" },
    { value: 25, label: "Vue", color: "#42b883" },
    { value: 20, label: "Angular", color: "#dd0031" },
    { value: 15, label: "Svelte", color: "#ff3e00" },
    { value: 10, label: "Other", color: "#6c757d" },
  ]

  const tableData = [
    ["John Doe", "Frontend Developer", "Active", "2 days ago"],
    ["Jane Smith", "Backend Developer", "Active", "1 week ago"],
    ["Mike Johnson", "Full Stack Developer", "Inactive", "2 weeks ago"],
    ["Sarah Wilson", "UI/UX Designer", "Active", "3 days ago"],
  ]

  const events = [
    { date: new Date(), title: "Team Meeting", time: "10:00 AM" },
    { date: new Date(), title: "Project Review", time: "2:00 PM" },
    { date: new Date(Date.now() + 86400000), title: "Client Call", time: "11:00 AM" },
  ]

  return (
    <ThemeProvider theme={currentTheme}>
      <Layout>
        <LayoutHeader>
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl font-bold">🎨</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                    UI Showcase
                  </h1>
                  <p className="text-muted-foreground text-lg">Beautiful Components Gallery</p>
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

          {/* Dashboard Components */}
          <LayoutSection variant="default" size="lg">
            <SectionHeader>
              <SectionTitle>Dashboard Components</SectionTitle>
              <SectionSubtitle>
                Powerful components for building beautiful dashboards
              </SectionSubtitle>
            </SectionHeader>

            <SectionContent>
              <DashboardGrid cols={4}>
                <DashboardMetric
                  icon="📊"
                  value="1,234"
                  label="Total Users"
                  change="+12%"
                  trend="up"
                />
                <DashboardMetric
                  icon="🚀"
                  value="567"
                  label="Active Projects"
                  change="+8%"
                  trend="up"
                />
                <DashboardMetric
                  icon="⭐"
                  value="98.5%"
                  label="Satisfaction Rate"
                  change="+2%"
                  trend="up"
                />
                <DashboardMetric
                  icon="💎"
                  value="89"
                  label="Premium Features"
                  change="+15%"
                  trend="up"
                />
              </DashboardGrid>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <DashboardChart title="User Growth" subtitle="Monthly user acquisition">
                  <LineChart data={lineChartData} width={400} height={200} />
                  <ChartLegend items={[
                    { color: "hsl(var(--primary))", label: "Users" }
                  ]} />
                </DashboardChart>

                <DashboardChart title="Framework Usage" subtitle="Popular frameworks">
                  <PieChart data={pieChartData} size={200} />
                  <ChartLegend items={pieChartData} />
                </DashboardChart>
              </div>

              <DashboardTable
                headers={["Name", "Position", "Status", "Last Active"]}
                data={tableData}
                className="mt-8"
              />
            </SectionContent>
          </LayoutSection>

          {/* Calendar Components */}
          <LayoutSection variant="muted" size="lg">
            <SectionHeader>
              <SectionTitle>Calendar Components</SectionTitle>
              <SectionSubtitle>
                Beautiful date selection and calendar interfaces
              </SectionSubtitle>
            </SectionHeader>

            <SectionContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Full Calendar</h3>
                  <CalendarMonth
                    month={new Date().getMonth()}
                    year={new Date().getFullYear()}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    events={events}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-4">Mini Calendar</h3>
                  <CalendarMini
                    date={selectedDate}
                    onDateSelect={setSelectedDate}
                  />
                </div>
              </div>
            </SectionContent>
          </LayoutSection>

          {/* Form Components */}
          <LayoutSection variant="default" size="lg">
            <SectionHeader>
              <SectionTitle>Form Components</SectionTitle>
              <SectionSubtitle>
                Elegant form elements for user input
              </SectionSubtitle>
            </SectionHeader>

            <SectionContent>
              <div className="max-w-2xl mx-auto">
                <Form variant="default" size="lg">
                  <FormGroup>
                    <FormLabel>Full Name</FormLabel>
                    <FormInput placeholder="Enter your full name" />
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel>Email</FormLabel>
                    <FormInput type="email" placeholder="Enter your email" />
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel>Message</FormLabel>
                    <FormTextarea placeholder="Enter your message" rows={4} />
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel>Category</FormLabel>
                    <FormSelect>
                      <FormOption value="">Select a category</FormOption>
                      <FormOption value="general">General</FormOption>
                      <FormOption value="support">Support</FormOption>
                      <FormOption value="feedback">Feedback</FormOption>
                    </FormSelect>
                  </FormGroup>
                  
                  <FormGroup>
                    <FormCheckbox label="I agree to the terms and conditions" />
                  </FormGroup>
                  
                  <FormActions>
                    <Button variant="outline">Cancel</Button>
                    <Button>Submit</Button>
                  </FormActions>
                </Form>
              </div>
            </SectionContent>
          </LayoutSection>

          {/* Animation Components */}
          <LayoutSection variant="muted" size="lg">
            <SectionHeader>
              <SectionTitle>Animation Components</SectionTitle>
              <SectionSubtitle>
                Smooth and engaging animations
              </SectionSubtitle>
            </SectionHeader>

            <SectionContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <FadeIn>
                  <Card className="p-6 text-center">
                    <p>Fade In</p>
                  </Card>
                </FadeIn>
                <SlideUp>
                  <Card className="p-6 text-center">
                    <p>Slide Up</p>
                  </Card>
                </SlideUp>
                <BounceIn>
                  <Card className="p-6 text-center">
                    <p>Bounce In</p>
                  </Card>
                </BounceIn>
                <ScaleIn>
                  <Card className="p-6 text-center">
                    <p>Scale In</p>
                  </Card>
                </ScaleIn>
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
            <MobileMenuItem href="#dashboard">Dashboard</MobileMenuItem>
            <MobileMenuItem href="#calendar">Calendar</MobileMenuItem>
            <MobileMenuItem href="#forms">Forms</MobileMenuItem>
            <MobileMenuItem href="#animations">Animations</MobileMenuItem>
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