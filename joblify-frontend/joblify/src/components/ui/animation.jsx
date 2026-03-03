import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

const animationVariants = cva(
  "",
  {
    variants: {
      type: {
        none: "",
        fade: "animate-fade-in",
        slide: "animate-slide-up",
        bounce: "animate-bounce-in",
        scale: "animate-scale-in",
        rotate: "animate-rotate-in",
        flip: "animate-flip-in",
        zoom: "animate-zoom-in",
        slideLeft: "animate-slide-left",
        slideRight: "animate-slide-right",
        slideUp: "animate-slide-up",
        slideDown: "animate-slide-down",
        pulse: "animate-pulse",
        spin: "animate-spin",
        ping: "animate-ping",
        wiggle: "animate-wiggle",
        shake: "animate-shake",
        float: "animate-float",
        glow: "animate-glow",
        shimmer: "animate-shimmer",
        heartbeat: "animate-heartbeat",
        rubberBand: "animate-rubber-band",
        swing: "animate-swing",
        tada: "animate-tada",
        wobble: "animate-wobble",
        hinge: "animate-hinge",
        rollIn: "animate-roll-in",
        rollOut: "animate-roll-out",
        lightSpeedIn: "animate-light-speed-in",
        lightSpeedOut: "animate-light-speed-out",
        flipInX: "animate-flip-in-x",
        flipInY: "animate-flip-in-y",
        flipOutX: "animate-flip-out-x",
        flipOutY: "animate-flip-out-y",
        bounceIn: "animate-bounce-in",
        bounceOut: "animate-bounce-out",
        fadeIn: "animate-fade-in",
        fadeOut: "animate-fade-out",
        slideInUp: "animate-slide-in-up",
        slideInDown: "animate-slide-in-down",
        slideInLeft: "animate-slide-in-left",
        slideInRight: "animate-slide-in-right",
        slideOutUp: "animate-slide-out-up",
        slideOutDown: "animate-slide-out-down",
        slideOutLeft: "animate-slide-out-left",
        slideOutRight: "animate-slide-out-right",
        zoomIn: "animate-zoom-in",
        zoomOut: "animate-zoom-out",
        rotateIn: "animate-rotate-in",
        rotateOut: "animate-rotate-out",
        hingeIn: "animate-hinge-in",
        hingeOut: "animate-hinge-out",
        jackInTheBox: "animate-jack-in-the-box",
        rollIn: "animate-roll-in",
        rollOut: "animate-roll-out",
      },
      duration: {
        fast: "duration-150",
        normal: "duration-300",
        slow: "duration-500",
        slower: "duration-700",
        slowest: "duration-1000",
      },
      delay: {
        none: "",
        fast: "delay-75",
        normal: "delay-150",
        slow: "delay-300",
        slower: "delay-500",
        slowest: "delay-700",
      },
      easing: {
        linear: "ease-linear",
        in: "ease-in",
        out: "ease-out",
        inOut: "ease-in-out",
        bounce: "ease-bounce",
        elastic: "ease-elastic",
      },
      iteration: {
        once: "",
        twice: "animate-twice",
        thrice: "animate-thrice",
        infinite: "animate-infinite",
      },
    },
    defaultVariants: {
      type: "none",
      duration: "normal",
      delay: "none",
      easing: "out",
      iteration: "once",
    },
  }
)

const Animation = React.forwardRef(({ 
  className, 
  type, 
  duration, 
  delay, 
  easing, 
  iteration, 
  children, 
  ...props 
}, ref) => (
  <div 
    ref={ref} 
    className={cn(animationVariants({ type, duration, delay, easing, iteration, className }))} 
    {...props}
  >
    {children}
  </div>
))
Animation.displayName = "Animation"

const FadeIn = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="fade" className={className} {...props}>
    {children}
  </Animation>
))
FadeIn.displayName = "FadeIn"

const SlideUp = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="slide" className={className} {...props}>
    {children}
  </Animation>
))
SlideUp.displayName = "SlideUp"

const BounceIn = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="bounce" className={className} {...props}>
    {children}
  </Animation>
))
BounceIn.displayName = "BounceIn"

const ScaleIn = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="scale" className={className} {...props}>
    {children}
  </Animation>
))
ScaleIn.displayName = "ScaleIn"

const RotateIn = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="rotate" className={className} {...props}>
    {children}
  </Animation>
))
RotateIn.displayName = "RotateIn"

const FlipIn = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="flip" className={className} {...props}>
    {children}
  </Animation>
))
FlipIn.displayName = "FlipIn"

const ZoomIn = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="zoom" className={className} {...props}>
    {children}
  </Animation>
))
ZoomIn.displayName = "ZoomIn"

const SlideLeft = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="slideLeft" className={className} {...props}>
    {children}
  </Animation>
))
SlideLeft.displayName = "SlideLeft"

const SlideRight = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="slideRight" className={className} {...props}>
    {children}
  </Animation>
))
SlideRight.displayName = "SlideRight"

const SlideDown = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="slideDown" className={className} {...props}>
    {children}
  </Animation>
))
SlideDown.displayName = "SlideDown"

const Pulse = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="pulse" className={className} {...props}>
    {children}
  </Animation>
))
Pulse.displayName = "Pulse"

const Spin = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="spin" className={className} {...props}>
    {children}
  </Animation>
))
Spin.displayName = "Spin"

const Ping = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="ping" className={className} {...props}>
    {children}
  </Animation>
))
Ping.displayName = "Ping"

const Wiggle = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="wiggle" className={className} {...props}>
    {children}
  </Animation>
))
Wiggle.displayName = "Wiggle"

const Shake = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="shake" className={className} {...props}>
    {children}
  </Animation>
))
Shake.displayName = "Shake"

const Float = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="float" className={className} {...props}>
    {children}
  </Animation>
))
Float.displayName = "Float"

const Glow = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="glow" className={className} {...props}>
    {children}
  </Animation>
))
Glow.displayName = "Glow"

const Shimmer = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="shimmer" className={className} {...props}>
    {children}
  </Animation>
))
Shimmer.displayName = "Shimmer"

const Heartbeat = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="heartbeat" className={className} {...props}>
    {children}
  </Animation>
))
Heartbeat.displayName = "Heartbeat"

const RubberBand = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="rubberBand" className={className} {...props}>
    {children}
  </Animation>
))
RubberBand.displayName = "RubberBand"

const Swing = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="swing" className={className} {...props}>
    {children}
  </Animation>
))
Swing.displayName = "Swing"

const Tada = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="tada" className={className} {...props}>
    {children}
  </Animation>
))
Tada.displayName = "Tada"

const Wobble = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="wobble" className={className} {...props}>
    {children}
  </Animation>
))
Wobble.displayName = "Wobble"

const Hinge = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="hinge" className={className} {...props}>
    {children}
  </Animation>
))
Hinge.displayName = "Hinge"

const RollIn = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="rollIn" className={className} {...props}>
    {children}
  </Animation>
))
RollIn.displayName = "RollIn"

const RollOut = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="rollOut" className={className} {...props}>
    {children}
  </Animation>
))
RollOut.displayName = "RollOut"

const LightSpeedIn = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="lightSpeedIn" className={className} {...props}>
    {children}
  </Animation>
))
LightSpeedIn.displayName = "LightSpeedIn"

const LightSpeedOut = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="lightSpeedOut" className={className} {...props}>
    {children}
  </Animation>
))
LightSpeedOut.displayName = "LightSpeedOut"

const FlipInX = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="flipInX" className={className} {...props}>
    {children}
  </Animation>
))
FlipInX.displayName = "FlipInX"

const FlipInY = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="flipInY" className={className} {...props}>
    {children}
  </Animation>
))
FlipInY.displayName = "FlipInY"

const FlipOutX = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="flipOutX" className={className} {...props}>
    {children}
  </Animation>
))
FlipOutX.displayName = "FlipOutX"

const FlipOutY = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="flipOutY" className={className} {...props}>
    {children}
  </Animation>
))
FlipOutY.displayName = "FlipOutY"

const BounceInAnimation = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="bounceIn" className={className} {...props}>
    {children}
  </Animation>
))
BounceInAnimation.displayName = "BounceInAnimation"

const BounceOut = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="bounceOut" className={className} {...props}>
    {children}
  </Animation>
))
BounceOut.displayName = "BounceOut"

const FadeInAnimation = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="fadeIn" className={className} {...props}>
    {children}
  </Animation>
))
FadeInAnimation.displayName = "FadeInAnimation"

const FadeOut = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="fadeOut" className={className} {...props}>
    {children}
  </Animation>
))
FadeOut.displayName = "FadeOut"

const SlideInUp = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="slideInUp" className={className} {...props}>
    {children}
  </Animation>
))
SlideInUp.displayName = "SlideInUp"

const SlideInDown = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="slideInDown" className={className} {...props}>
    {children}
  </Animation>
))
SlideInDown.displayName = "SlideInDown"

const SlideInLeft = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="slideInLeft" className={className} {...props}>
    {children}
  </Animation>
))
SlideInLeft.displayName = "SlideInLeft"

const SlideInRight = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="slideInRight" className={className} {...props}>
    {children}
  </Animation>
))
SlideInRight.displayName = "SlideInRight"

const SlideOutUp = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="slideOutUp" className={className} {...props}>
    {children}
  </Animation>
))
SlideOutUp.displayName = "SlideOutUp"

const SlideOutDown = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="slideOutDown" className={className} {...props}>
    {children}
  </Animation>
))
SlideOutDown.displayName = "SlideOutDown"

const SlideOutLeft = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="slideOutLeft" className={className} {...props}>
    {children}
  </Animation>
))
SlideOutLeft.displayName = "SlideOutLeft"

const SlideOutRight = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="slideOutRight" className={className} {...props}>
    {children}
  </Animation>
))
SlideOutRight.displayName = "SlideOutRight"

const ZoomInAnimation = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="zoomIn" className={className} {...props}>
    {children}
  </Animation>
))
ZoomInAnimation.displayName = "ZoomInAnimation"

const ZoomOut = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="zoomOut" className={className} {...props}>
    {children}
  </Animation>
))
ZoomOut.displayName = "ZoomOut"

const RotateInAnimation = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="rotateIn" className={className} {...props}>
    {children}
  </Animation>
))
RotateInAnimation.displayName = "RotateInAnimation"

const RotateOut = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="rotateOut" className={className} {...props}>
    {children}
  </Animation>
))
RotateOut.displayName = "RotateOut"

const HingeIn = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="hingeIn" className={className} {...props}>
    {children}
  </Animation>
))
HingeIn.displayName = "HingeIn"

const HingeOut = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="hingeOut" className={className} {...props}>
    {children}
  </Animation>
))
HingeOut.displayName = "HingeOut"

const JackInTheBox = React.forwardRef(({ className, children, ...props }, ref) => (
  <Animation ref={ref} type="jackInTheBox" className={className} {...props}>
    {children}
  </Animation>
))
JackInTheBox.displayName = "JackInTheBox"

export { 
  Animation, 
  FadeIn, 
  SlideUp, 
  BounceIn, 
  ScaleIn, 
  RotateIn, 
  FlipIn, 
  ZoomIn, 
  SlideLeft, 
  SlideRight, 
  SlideDown, 
  Pulse, 
  Spin, 
  Ping, 
  Wiggle, 
  Shake, 
  Float, 
  Glow, 
  Shimmer, 
  Heartbeat, 
  RubberBand, 
  Swing, 
  Tada, 
  Wobble, 
  Hinge, 
  RollIn, 
  RollOut, 
  LightSpeedIn, 
  LightSpeedOut, 
  FlipInX, 
  FlipInY, 
  FlipOutX, 
  FlipOutY, 
  BounceInAnimation, 
  BounceOut, 
  FadeInAnimation, 
  FadeOut, 
  SlideInUp, 
  SlideInDown, 
  SlideInLeft, 
  SlideInRight, 
  SlideOutUp, 
  SlideOutDown, 
  SlideOutLeft, 
  SlideOutRight, 
  ZoomInAnimation, 
  ZoomOut, 
  RotateInAnimation, 
  RotateOut, 
  HingeIn, 
  HingeOut, 
  JackInTheBox, 
  animationVariants 
} 