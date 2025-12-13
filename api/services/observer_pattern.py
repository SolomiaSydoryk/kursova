"""
Observer Pattern для системи сповіщень.
Дозволяє підписуватися на події та отримувати сповіщення.
"""
from abc import ABC, abstractmethod
from typing import List
from api.models import Notification, CustomUser
from api.services.notification import NotificationService, EmailNotifier, SMSNotifier, LogNotifier


class Observer(ABC):
    """Абстрактний спостерігач"""
    
    @abstractmethod
    def update(self, notification: Notification):
        """Отримати сповіщення про подію"""
        pass


class EmailObserver(Observer):
    """Спостерігач, який відправляє сповіщення на email"""
    
    def __init__(self):
        self.notifier = EmailNotifier()
    
    def update(self, notification: Notification):
        """Відправити сповіщення на email"""
        self.notifier.send(notification)


class SMSObserver(Observer):
    """Спостерігач, який відправляє сповіщення через SMS"""
    
    def __init__(self):
        self.notifier = SMSNotifier()
    
    def update(self, notification: Notification):
        """Відправити сповіщення через SMS"""
        self.notifier.send(notification)


class LogObserver(Observer):
    """Спостерігач, який логує сповіщення"""
    
    def __init__(self):
        self.notifier = LogNotifier()
    
    def update(self, notification: Notification):
        """Залогувати сповіщення"""
        self.notifier.send(notification)


class Subject(ABC):
    """Абстрактний об'єкт, за яким спостерігають"""
    
    def __init__(self):
        self._observers: List[Observer] = []
    
    def attach(self, observer: Observer):
        """Підписати спостерігача"""
        if observer not in self._observers:
            self._observers.append(observer)
    
    def detach(self, observer: Observer):
        """Відписати спостерігача"""
        if observer in self._observers:
            self._observers.remove(observer)
    
    def notify(self, notification: Notification):
        """Сповістити всіх спостерігачів"""
        for observer in self._observers:
            observer.update(notification)


class NotificationSubject(Subject):
    """
    Суб'єкт для сповіщень.
    Коли створюється нове сповіщення, всі підписані спостерігачі отримують його.
    """
    
    def __init__(self):
        super().__init__()
        # Додаємо стандартних спостерігачів
        self.attach(EmailObserver())
        self.attach(SMSObserver())
        self.attach(LogObserver())
    
    def create_notification(self, customer: CustomUser, notification_type: str, message: str):
        """
        Створити сповіщення та сповістити всіх спостерігачів.
        
        Args:
            customer: Користувач, якому призначене сповіщення
            notification_type: Тип сповіщення ('reminder', 'promo', 'bonus')
            message: Текст сповіщення
        """
        notification = Notification.objects.create(
            customer=customer,
            notification_type=notification_type,
            message=message
        )
        
        # Сповіщаємо всіх спостерігачів
        self.notify(notification)
        
        return notification


# Singleton для глобального доступу до NotificationSubject
class NotificationManager:
    """
    Singleton для управління сповіщеннями.
    Забезпечує єдину точку доступу до системи сповіщень.
    """
    _instance = None
    _subject = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(NotificationManager, cls).__new__(cls)
            cls._subject = NotificationSubject()
        return cls._instance
    
    @property
    def subject(self) -> NotificationSubject:
        """Отримати суб'єкт сповіщень"""
        return self._subject
    
    def create_notification(self, customer: CustomUser, notification_type: str, message: str):
        """Створити сповіщення через Singleton"""
        return self._subject.create_notification(customer, notification_type, message)

