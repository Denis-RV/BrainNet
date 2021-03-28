==TO\_CHAR(number/date, `format mask, nls_parameters`) = T== - перевод чисел и дат в текст. Возвращает тип VARCHAR(2). Format mask - задает маску форматирования, которая позволяет определить, как извлекать числа из текстф с символами.

### Числа
![[Pasted image 20210311222910.png]]

```sql
SQL> select  to_char(183) from dual;

TO_
---
183

SQL> select  to_char(184, '99') from dual;

TO_
---
###

SQL> select  to_char(18, '099999') from dual;

TO_CHAR
-------
 000018

SQL> select  to_char(18.33, '999.999') from dual;

TO_CHAR
--------
  18.330

SQL> select  to_char(18.33, '999D999') from dual;

TO_CHAR
--------
  18.330

SQL> select  to_char(1234567, '99,999,999') from dual;

TO_CHAR
-----------
  1,234,567

SQL> select  to_char(1234567, '99G99G99G99') from dual;

TO_CHAR
------------
  1,23,45,67

SQL> select  to_char(183, '$9999') from dual;

TO_CHA
------
  $183

SQL> select  to_char(183, 'L9999') from dual;

TO_CHAR
---------------
           $183

SQL> select  to_char(-183, '9999MI') from dual;

TO_CH
-----
 183-

SQL> select  to_char(-183, '9999PR') from dual;

TO_CHA
------
 <183>

SQL> select  to_char(183, '9999PR') from dual;

TO_CHA
------
  183

SQL> select  to_char(18, 's999') from dual;

TO_C
----
 +18

SQL>

```

### Даты  
Маски для дат чувствительны к регистру. Из дат мы делаем текст в таком формате, который мы захотим. Первым аргементом нельзя передавать дату в виде текста, ее необходиомо привести к типу даты.
![[Pasted image 20210312175900.png]]
![[Pasted image 20210312182322.png]]
![[Pasted image 20210312182725.png]]
```sql
select hire_date, TO_CHAR(HIRE_DATE, 'Month', 'NLS_DATE_LANGUAGE = RUSSIAN')  
    from EMPLOYEES;
	
2003-06-17 00:00:00,Июнь    
2005-09-21 00:00:00,Сентябрь
```

```sql
select TO\_CHAR(SYSDATE, 'YYYY') from dual;  
select TO\_CHAR(SYSDATE, 'RR') from dual;  
select TO\_CHAR(SYSDATE, 'YEAR') from dual;  
select TO\_CHAR(SYSDATE, 'Year') from dual;  
select TO\_CHAR(SYSDATE, 'MM') from dual;  
select TO\_CHAR(SYSDATE, 'mon') from dual;  
select TO\_CHAR(SYSDATE, 'MONTh') from dual;  
  
select hire\_date, TO\_CHAR(HIRE\_DATE, 'Month') || 'Hello'  
 from EMPLOYEES;  
select hire\_date, TO\_CHAR(HIRE\_DATE, 'fmMonth') || ' Hello'  
 from EMPLOYEES;  
  
select TO\_CHAR(Sysdate, 'D') from DUAL;  
select TO\_CHAR(Sysdate, 'dd') from DUAL;  
select TO\_CHAR(Sysdate, 'ddd') from DUAL; 
select TO\_CHAR(Sysdate, 'DY') from DUAL; 
select TO\_CHAR(Sysdate, 'Day') from DUAL;
select TO\_CHAR(Sysdate, 'W') from DUAL; 
select TO\_CHAR(Sysdate, 'WW') from DUAL; 
select TO\_CHAR(Sysdate, 'Q') from DUAL; 
select TO\_CHAR(Sysdate, 'CC') from DUAL; 


```

---
*tegs:* #db, #sql, #sqlFunction, #conversion_func #single-row_func 