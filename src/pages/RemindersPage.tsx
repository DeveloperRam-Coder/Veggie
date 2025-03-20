
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import RemindersSection from '@/components/RemindersSection';
import { ThemeToggle } from '@/components/ThemeToggle';

const RemindersPage = () => {
  return (
    <div className="container px-4 py-4 sm:py-8 mx-auto max-w-4xl transition-colors duration-300">
      <header className="mb-6">
        <div className="flex flex-row justify-between items-center mb-4">
          <div className="flex items-center">
            <Link to="/">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Meal Reminders
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Set up reminders to help you stay on track with your meal schedule
              </p>
            </div>
          </div>
          
          <ThemeToggle />
        </div>
      </header>

      <RemindersSection />
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">About Meal Reminders</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
          <p>
            Consistency is key for healthy weight gain. Setting up regular reminders helps you develop 
            a routine for your meals, ensuring you don't miss important nutrition throughout the day.
          </p>
          <p>
            For each reminder, you can choose from different alarm sounds and customize when you want to be notified.
            We recommend setting reminders 15-30 minutes before your planned meal times to give you time to prepare.
          </p>
          <p>
            Remember to keep notifications enabled in your browser or device settings to receive these reminders.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default RemindersPage;
