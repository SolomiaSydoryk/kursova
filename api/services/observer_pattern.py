"""
Observer Pattern для системи сповіщень.
Дозволяє підписуватися на події створення сповіщень та обробляти їх через різні канали.
"""
from abc import ABC, abstractmethod
from typing import List
from api.models import Notification
import logging

logger = logging.getLogger(__name__)


class Observer(ABC):
    """Абстрактний спостерігач"""
    
    @abstractmethod
    def update(self, notification: Notification):
        """Отримати сповіщення про подію"""
        pass


class UIObserver(Observer):
    """
    Спостерігач для UI.
    Сповіщення вже зберігається в БД і автоматично відображається через API,
    тому цей спостерігач просто логує подію.
    """
    
    def update(self, notification: Notification):
        """Логує створення сповіщення для UI"""
        logger.info(
            "[UI] Notification created for %s (%s): %s",
            notification.customer,
            notification.notification_type,
            notification.message
        )


class LogObserver(Observer):
    """Спостерігач, який логує сповіщення"""
    
    def update(self, notification: Notification):
        """Залогувати сповіщення"""
        logger.info(
            "[LOG] Notification for %s (%s): %s",
            notification.customer,
            notification.notification_type,
            notification.message
        )


class NotificationSubject:
    """
    Суб'єкт для сповіщень (Subject в Observer Pattern).
    Коли створюється нове сповіщення, всі підписані спостерігачі отримують його.
    """
    
    def __init__(self):
        self._observers: List[Observer] = []
        # Додаємо стандартних спостерігачів
        self.attach(UIObserver())
        self.attach(LogObserver())
    
    def attach(self, observer: Observer):
        """Підписати спостерігача"""
        if observer not in self._observers:
            self._observers.append(observer)
            logger.debug("Observer %s attached", observer.__class__.__name__)
    
    def detach(self, observer: Observer):
        """Відписати спостерігача"""
        if observer in self._observers:
            self._observers.remove(observer)
            logger.debug("Observer %s detached", observer.__class__.__name__)
    
    def notify_observers(self, notification: Notification):
        """Сповістити всіх спостерігачів про нове сповіщення"""
        for observer in self._observers:
            try:
                observer.update(notification)
            except Exception as e:
                logger.error(
                    "Observer %s failed: %s",
                    observer.__class__.__name__,
                    str(e)
                )


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

